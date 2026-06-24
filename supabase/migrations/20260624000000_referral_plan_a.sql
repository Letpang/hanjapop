-- 리퍼럴 A안: 1명→20% 할인권, 3명→50% 할인권, 5명→무료
-- 크레딧 보상 제거, 할인권 만료 제거, 1명 마일스톤을 20% 할인 offer로 변경

alter table public.referral_offers
    alter column expires_at drop not null,
    alter column expires_at drop default;

update public.referral_offers
set expires_at = null
where status = 'active'
  and discount_percent in (20, 50);

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
      and expires_at is not null
      and expires_at <= now();

    select * into v_offer
    from public.referral_offers
    where account_id = v_account_id
      and status = 'active'
      and (expires_at is null or expires_at > now())
    order by discount_percent desc, expires_at desc nulls first
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

-- ensure_referral_milestones: 1명 크레딧→20% 할인권으로 변경
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

    -- 1명: 20% 할인권
    if v_count >= 1 then
        insert into public.referral_milestone_rewards(account_id, milestone, reward_type, reward_value)
        values (p_account_id, 1, 'discount', 20)
        on conflict (account_id, milestone) do nothing;

        insert into public.referral_offers(account_id, referral_id, discount_percent, expires_at)
        select p_account_id, null, 20, null
        where not exists (
            select 1 from public.referral_offers
            where account_id = p_account_id
              and discount_percent >= 20
              and status = 'active'
              and (expires_at is null or expires_at > now())
        );
    end if;

    -- 3명: 50% 할인권
    if v_count >= 3 then
        insert into public.referral_milestone_rewards(account_id, milestone, reward_type, reward_value)
        values (p_account_id, 3, 'discount', 50)
        on conflict (account_id, milestone) do nothing;

        insert into public.referral_offers(account_id, referral_id, discount_percent, expires_at)
        select p_account_id, null, 50, null
        where not exists (
            select 1 from public.referral_offers
            where account_id = p_account_id
              and discount_percent = 50
              and status = 'active'
              and (expires_at is null or expires_at > now())
        );
    end if;

    -- 5명: 풀팩 무료
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

-- activate_my_referral: 피추천자 XP 제거, 20% 할인권으로 변경
create or replace function public.activate_my_referral()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_account_id uuid;
    v_referral public.referrals;
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

    -- 피추천자: 20% 할인권 (만료 없음)
    insert into public.referral_offers(account_id, referral_id, discount_percent)
    values (v_account_id, v_referral.id, 20);

    -- 추천자: 마일스톤 확인 → 1명 달성 시 20% 할인권 발급
    perform public.ensure_referral_milestones(v_referral.referrer_account_id);

    return jsonb_build_object(
        'activated', true,
        'referred_reward_xp', 0,
        'offer', public.get_my_referral_offer()
    );
end;
$$;

-- get_my_referral_summary: 크레딧 제거, 마일스톤 라벨 업데이트
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
        'active_offer', v_offer,
        'fullpack_granted', coalesce(v_has_fullpack, false),
        'milestones', jsonb_build_array(
            jsonb_build_object('count', 1, 'title', '풀팩 20% 할인권', 'subtitle', '만료 없음', 'done', coalesce(v_activated_count, 0) >= 1),
            jsonb_build_object('count', 3, 'title', '풀팩 50% 할인권', 'subtitle', '만료 없음', 'done', coalesce(v_activated_count, 0) >= 3),
            jsonb_build_object('count', 5, 'title', '풀팩 무료 소장권', 'subtitle', '만료 없음', 'done', coalesce(v_activated_count, 0) >= 5)
        )
    );
end;
$$;
