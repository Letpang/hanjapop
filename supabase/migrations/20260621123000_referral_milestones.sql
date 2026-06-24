alter table public.account_profiles
    add column if not exists referral_credits integer not null default 0;

alter table public.referral_offers
    drop constraint if exists referral_offers_discount_percent_check;

alter table public.referral_offers
    add constraint referral_offers_discount_percent_check
    check (discount_percent between 1 and 100);

create or replace function public.get_my_referral_offer()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_account_id uuid;
    v_offer public.referral_offers;
begin
    v_account_id := public.ensure_my_account();

    update public.referral_offers
    set status = 'expired'
    where account_id = v_account_id
      and status = 'active'
      and expires_at <= now();

    select * into v_offer
    from public.referral_offers
    where account_id = v_account_id
      and status = 'active'
      and expires_at > now()
    order by discount_percent desc, expires_at desc
    limit 1;

    if v_offer.id is null then
        return jsonb_build_object('eligible', false);
    end if;

    return jsonb_build_object(
        'eligible', true,
        'offer_id', v_offer.id,
        'discount_percent', v_offer.discount_percent,
        'expires_at', v_offer.expires_at
    );
end;
$$;

create table if not exists public.referral_milestone_rewards (
    id uuid primary key default gen_random_uuid(),
    account_id uuid not null references public.app_accounts(id) on delete cascade,
    milestone integer not null check (milestone in (1, 3, 5)),
    reward_type text not null check (reward_type in ('credits', 'discount', 'fullpack')),
    reward_value integer not null default 0,
    created_at timestamptz not null default now(),
    unique (account_id, milestone)
);

alter table public.referral_milestone_rewards enable row level security;
revoke all on public.referral_milestone_rewards from anon, authenticated;

create or replace function public.ensure_referral_milestones(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_count integer;
begin
    select count(*) into v_count
    from public.referrals
    where referrer_account_id = p_account_id
      and status in ('activated', 'rewarded');

    if v_count >= 1 then
        insert into public.referral_milestone_rewards(account_id, milestone, reward_type, reward_value)
        values (p_account_id, 1, 'credits', 3000)
        on conflict (account_id, milestone) do nothing;
    end if;

    if v_count >= 3 then
        insert into public.referral_milestone_rewards(account_id, milestone, reward_type, reward_value)
        values (p_account_id, 3, 'discount', 50)
        on conflict (account_id, milestone) do nothing;

        insert into public.referral_offers(account_id, referral_id, discount_percent, expires_at)
        select p_account_id, null, 50, now() + interval '30 days'
        where not exists (
            select 1 from public.referral_offers
            where account_id = p_account_id
              and discount_percent = 50
              and status = 'active'
              and expires_at > now()
        );
    end if;

    if v_count >= 5 then
        insert into public.referral_milestone_rewards(account_id, milestone, reward_type, reward_value)
        values (p_account_id, 5, 'fullpack', 3)
        on conflict (account_id, milestone) do nothing;

        insert into public.purchase_grants(
            provider, external_transaction_id, account_id, pack, status, purchased_at, source_event_at
        ) values (
            'legacy', 'referral-fullpack:' || p_account_id::text, p_account_id, 3, 'active', now(), now()
        )
        on conflict (provider, external_transaction_id) do nothing;

        perform public.recompute_account_entitlement(p_account_id);
    end if;
end;
$$;

create or replace function public.get_my_referral_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_account_id uuid;
    v_code text;
    v_activated_count integer;
    v_credits integer;
    v_offer jsonb;
    v_has_fullpack boolean;
begin
    v_account_id := public.ensure_my_account();
    v_code := public.get_my_referral_code();
    perform public.ensure_referral_milestones(v_account_id);

    select count(*) into v_activated_count
    from public.referrals
    where referrer_account_id = v_account_id
      and status in ('activated', 'rewarded');

    select coalesce(referral_credits, 0) into v_credits
    from public.account_profiles
    where account_id = v_account_id;

    v_offer := public.get_my_referral_offer();

    select exists (
        select 1 from public.purchase_grants
        where account_id = v_account_id
          and provider = 'legacy'
          and external_transaction_id = 'referral-fullpack:' || v_account_id::text
          and status = 'active'
    ) into v_has_fullpack;

    return jsonb_build_object(
        'code', v_code,
        'activated_count', coalesce(v_activated_count, 0),
        'referral_credits', coalesce(v_credits, 0),
        'active_offer', v_offer,
        'fullpack_granted', coalesce(v_has_fullpack, false),
        'milestones', jsonb_build_array(
            jsonb_build_object('count', 1, 'title', '추천 크레딧 3,000', 'done', coalesce(v_activated_count, 0) >= 1),
            jsonb_build_object('count', 3, 'title', '풀팩 50% 할인권', 'done', coalesce(v_activated_count, 0) >= 3),
            jsonb_build_object('count', 5, 'title', '풀팩 무료 소장권', 'done', coalesce(v_activated_count, 0) >= 5)
        )
    );
end;
$$;

create or replace function public.activate_my_referral()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_account_id uuid;
    v_referral public.referrals;
    v_referred_reward integer := 300;
    v_referrer_credit_reward integer := 3000;
begin
    v_account_id := public.ensure_my_account();

    select * into v_referral
    from public.referrals
    where referred_account_id = v_account_id
    order by created_at asc
    limit 1;

    if v_referral.id is null then
        return jsonb_build_object('activated', false, 'reason', 'no_referral');
    end if;

    if v_referral.status in ('activated', 'rewarded') then
        return jsonb_build_object(
            'activated', false,
            'reason', 'already_activated',
            'offer', public.get_my_referral_offer()
        );
    end if;

    update public.referrals
    set status = 'activated',
        activated_at = now(),
        rewarded_at = now()
    where id = v_referral.id;

    insert into public.account_profiles(account_id, xp, level, last_active, updated_at)
    values (v_account_id, v_referred_reward, 1, now(), now())
    on conflict (account_id) do update set
        xp = account_profiles.xp + v_referred_reward,
        updated_at = now();

    insert into public.account_profiles(account_id, xp, level, referral_credits, last_active, updated_at)
    values (v_referral.referrer_account_id, 0, 1, v_referrer_credit_reward, now(), now())
    on conflict (account_id) do update set
        referral_credits = account_profiles.referral_credits + v_referrer_credit_reward,
        updated_at = now();

    insert into public.referral_milestone_rewards(account_id, milestone, reward_type, reward_value)
    values (v_referral.referrer_account_id, 1, 'credits', 3000)
    on conflict (account_id, milestone) do nothing;

    perform public.ensure_referral_milestones(v_referral.referrer_account_id);

    insert into public.referral_offers(account_id, referral_id, discount_percent)
    values (v_account_id, v_referral.id, 20);

    return jsonb_build_object(
        'activated', true,
        'referred_reward_xp', v_referred_reward,
        'referrer_reward_credits', v_referrer_credit_reward,
        'offer', public.get_my_referral_offer()
    );
end;
$$;

revoke all on function public.ensure_referral_milestones(uuid) from public;
revoke all on function public.get_my_referral_summary() from public;
revoke all on function public.get_my_referral_offer() from public;
grant execute on function public.ensure_referral_milestones(uuid) to service_role;
grant execute on function public.get_my_referral_summary() to authenticated;
grant execute on function public.get_my_referral_offer() to authenticated;
