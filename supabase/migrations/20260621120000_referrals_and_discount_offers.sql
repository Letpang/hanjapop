create table if not exists public.referral_codes (
    account_id uuid primary key references public.app_accounts(id) on delete cascade,
    code text not null unique check (code ~ '^[A-Z0-9]{6,16}$'),
    created_at timestamptz not null default now()
);

create table if not exists public.referrals (
    id uuid primary key default gen_random_uuid(),
    referrer_account_id uuid not null references public.app_accounts(id) on delete cascade,
    referred_account_id uuid not null references public.app_accounts(id) on delete cascade,
    code text not null,
    status text not null default 'pending' check (status in ('pending', 'activated', 'rewarded', 'rejected')),
    accepted_at timestamptz not null default now(),
    activated_at timestamptz,
    rewarded_at timestamptz,
    created_at timestamptz not null default now(),
    unique (referred_account_id),
    check (referrer_account_id <> referred_account_id)
);

create index if not exists referrals_referrer_idx
    on public.referrals(referrer_account_id, status, created_at desc);

create table if not exists public.referral_offers (
    id uuid primary key default gen_random_uuid(),
    account_id uuid not null references public.app_accounts(id) on delete cascade,
    referral_id uuid references public.referrals(id) on delete set null,
    discount_percent integer not null default 20 check (discount_percent between 1 and 90),
    status text not null default 'active' check (status in ('active', 'used', 'expired', 'revoked')),
    expires_at timestamptz not null default (now() + interval '72 hours'),
    used_at timestamptz,
    created_at timestamptz not null default now()
);

create index if not exists referral_offers_account_idx
    on public.referral_offers(account_id, status, expires_at desc);

alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_offers enable row level security;

revoke all on public.referral_codes from anon, authenticated;
revoke all on public.referrals from anon, authenticated;
revoke all on public.referral_offers from anon, authenticated;

create or replace function public.generate_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    v_code text;
begin
    loop
        v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8));
        exit when not exists (select 1 from public.referral_codes where code = v_code);
    end loop;
    return v_code;
end;
$$;

create or replace function public.get_my_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    v_account_id uuid;
    v_code text;
begin
    v_account_id := public.ensure_my_account();

    select code into v_code
    from public.referral_codes
    where account_id = v_account_id;

    if v_code is null then
        v_code := public.generate_referral_code();
        insert into public.referral_codes(account_id, code)
        values (v_account_id, v_code)
        on conflict (account_id) do update set code = referral_codes.code
        returning code into v_code;
    end if;

    return v_code;
end;
$$;

create or replace function public.accept_referral(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_referred_account_id uuid;
    v_referrer_account_id uuid;
    v_code text := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
begin
    v_referred_account_id := public.ensure_my_account();
    if length(v_code) < 6 then
        return jsonb_build_object('accepted', false, 'reason', 'invalid_code');
    end if;

    select account_id into v_referrer_account_id
    from public.referral_codes
    where code = v_code;

    if v_referrer_account_id is null then
        return jsonb_build_object('accepted', false, 'reason', 'unknown_code');
    end if;
    if v_referrer_account_id = v_referred_account_id then
        return jsonb_build_object('accepted', false, 'reason', 'self_referral');
    end if;
    if exists (select 1 from public.referrals where referred_account_id = v_referred_account_id) then
        return jsonb_build_object('accepted', false, 'reason', 'already_referred');
    end if;

    insert into public.referrals(referrer_account_id, referred_account_id, code)
    values (v_referrer_account_id, v_referred_account_id, v_code);

    return jsonb_build_object('accepted', true);
end;
$$;

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
    order by expires_at desc
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

create or replace function public.activate_my_referral()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_account_id uuid;
    v_referral public.referrals;
    v_offer_id uuid;
    v_referred_reward integer := 300;
    v_referrer_reward integer := 500;
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

    insert into public.account_profiles(account_id, xp, level, last_active, updated_at)
    values (v_referral.referrer_account_id, v_referrer_reward, 1, now(), now())
    on conflict (account_id) do update set
        xp = account_profiles.xp + v_referrer_reward,
        updated_at = now();

    insert into public.referral_offers(account_id, referral_id, discount_percent)
    values (v_account_id, v_referral.id, 20)
    returning id into v_offer_id;

    return jsonb_build_object(
        'activated', true,
        'referred_reward_xp', v_referred_reward,
        'referrer_reward_xp', v_referrer_reward,
        'offer', public.get_my_referral_offer()
    );
end;
$$;

create or replace function public.consume_referral_offer(p_offer_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.referral_offers
    set status = 'used',
        used_at = now()
    where id = p_offer_id
      and status = 'active';
end;
$$;

revoke all on function public.generate_referral_code() from public;
revoke all on function public.get_my_referral_code() from public;
revoke all on function public.accept_referral(text) from public;
revoke all on function public.get_my_referral_offer() from public;
revoke all on function public.activate_my_referral() from public;
revoke all on function public.consume_referral_offer(uuid) from public;

grant execute on function public.get_my_referral_code() to authenticated;
grant execute on function public.accept_referral(text) to authenticated;
grant execute on function public.get_my_referral_offer() to authenticated;
grant execute on function public.activate_my_referral() to authenticated;
grant execute on function public.consume_referral_offer(uuid) to service_role;
