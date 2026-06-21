create table if not exists public.purchase_events (
    id bigint generated always as identity primary key,
    provider text not null check (provider in ('lemon', 'revenuecat', 'legacy')),
    external_event_id text not null,
    account_id uuid not null references public.app_accounts(id) on delete cascade,
    event_type text not null,
    occurred_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique (provider, external_event_id)
);

create table if not exists public.purchase_grants (
    id uuid primary key default gen_random_uuid(),
    provider text not null check (provider in ('lemon', 'revenuecat', 'legacy')),
    external_transaction_id text not null,
    account_id uuid not null references public.app_accounts(id) on delete cascade,
    pack integer not null check (pack between 1 and 3),
    status text not null check (status in ('active', 'refunded', 'revoked')),
    purchased_at timestamptz,
    source_event_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (provider, external_transaction_id)
);

create index if not exists purchase_grants_account_idx
    on public.purchase_grants(account_id, status);

alter table public.purchase_events enable row level security;
alter table public.purchase_grants enable row level security;

create policy "read own purchase grants" on public.purchase_grants
    for select to authenticated using (account_id = public.current_account_id());

revoke all on public.purchase_events from anon, authenticated;
revoke all on public.purchase_grants from anon;
grant select on public.purchase_grants to authenticated;

create or replace function public.recompute_account_entitlement(p_account_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_has_pack1 boolean;
    v_has_pack2 boolean;
    v_has_full boolean;
    v_pack integer;
begin
    select
        coalesce(bool_or(pack = 1), false),
        coalesce(bool_or(pack = 2), false),
        coalesce(bool_or(pack = 3), false)
      into v_has_pack1, v_has_pack2, v_has_full
    from public.purchase_grants
    where account_id = p_account_id and status = 'active';

    v_pack := case
        when v_has_full or (v_has_pack1 and v_has_pack2) then 3
        when v_has_pack2 then 2
        when v_has_pack1 then 1
        else 0
    end;

    insert into public.account_profiles(account_id, unlocked_pack, is_premium)
    values (p_account_id, v_pack, v_pack > 0)
    on conflict (account_id) do update set
        unlocked_pack = excluded.unlocked_pack,
        is_premium = excluded.is_premium,
        updated_at = now();

    return v_pack;
end;
$$;

create or replace function public.record_verified_purchase(
    p_provider text,
    p_event_id text,
    p_event_type text,
    p_transaction_id text,
    p_account_id uuid,
    p_pack integer,
    p_status text,
    p_purchased_at timestamptz default null,
    p_event_at timestamptz default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
    if p_provider not in ('lemon', 'revenuecat')
       or p_pack not between 1 and 3
       or p_status not in ('active', 'refunded', 'revoked')
       or p_event_id is null
       or p_transaction_id is null
       or not exists (select 1 from public.app_accounts where id = p_account_id) then
        raise exception 'Invalid verified purchase';
    end if;

    insert into public.purchase_events(
        provider, external_event_id, account_id, event_type, occurred_at
    ) values (
        p_provider, p_event_id, p_account_id, p_event_type, coalesce(p_event_at, p_purchased_at, now())
    ) on conflict (provider, external_event_id) do nothing;

    insert into public.purchase_grants(
        provider, external_transaction_id, account_id, pack, status, purchased_at, source_event_at, updated_at
    ) values (
        p_provider, p_transaction_id, p_account_id, p_pack, p_status,
        p_purchased_at, coalesce(p_event_at, p_purchased_at, now()), now()
    )
    on conflict (provider, external_transaction_id) do update set
        account_id = excluded.account_id,
        pack = excluded.pack,
        status = excluded.status,
        purchased_at = coalesce(purchase_grants.purchased_at, excluded.purchased_at),
        source_event_at = excluded.source_event_at,
        updated_at = now()
        where excluded.source_event_at >= purchase_grants.source_event_at;

    return public.recompute_account_entitlement(p_account_id);
end;
$$;

create or replace function public.get_my_entitlement()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_account_id uuid;
    v_pack integer;
begin
    v_account_id := public.ensure_my_account();
    select coalesce(unlocked_pack, 0) into v_pack
    from public.account_profiles where account_id = v_account_id;
    return jsonb_build_object(
        'account_id', v_account_id,
        'pack', coalesce(v_pack, 0),
        'is_premium', coalesce(v_pack, 0) > 0
    );
end;
$$;

-- Preserve existing verified/manual purchase state as a legacy grant.
insert into public.purchase_grants(
    provider, external_transaction_id, account_id, pack, status, purchased_at
)
select
    'legacy', 'migration:' || account_id::text, account_id, unlocked_pack, 'active', updated_at
from public.account_profiles
where unlocked_pack between 1 and 3
on conflict (provider, external_transaction_id) do nothing;

-- Client sync must never accept premium state from localStorage.
create or replace function public.sync_my_account_data(p_profile jsonb, p_learning jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_account_id uuid;
    v_old_profile jsonb;
    v_old_learning jsonb;
begin
    v_account_id := public.ensure_my_account();

    select to_jsonb(p) into v_old_profile
    from public.account_profiles p where account_id = v_account_id;
    select to_jsonb(l) into v_old_learning
    from public.account_learning_data l where account_id = v_account_id;

    if v_old_profile is not null or v_old_learning is not null then
        insert into public.account_backup_versions(account_id, profile_data, learning_data)
        values (v_account_id, v_old_profile, v_old_learning);
    end if;

    insert into public.account_profiles(
        account_id, nickname, character_type, xp, level, streak_count,
        unlocked_pack, is_premium, last_active, updated_at
    ) values (
        v_account_id,
        coalesce(nullif(p_profile ->> 'nickname', ''), '한자학습자'),
        coalesce(nullif(p_profile ->> 'character_type', ''), 'garae'),
        coalesce((p_profile ->> 'xp')::integer, 0),
        coalesce((p_profile ->> 'level')::integer, 1),
        coalesce((p_profile ->> 'streak_count')::integer, 0),
        0, false, now(), now()
    )
    on conflict (account_id) do update set
        nickname = case when excluded.xp >= account_profiles.xp then excluded.nickname else account_profiles.nickname end,
        character_type = case when excluded.xp >= account_profiles.xp then excluded.character_type else account_profiles.character_type end,
        xp = greatest(account_profiles.xp, excluded.xp),
        level = greatest(account_profiles.level, excluded.level),
        streak_count = greatest(account_profiles.streak_count, excluded.streak_count),
        last_active = now(),
        updated_at = now();

    insert into public.account_learning_data(
        account_id, mastery_data, srs_data, total_stats, unlocked_stickers,
        curriculum_progress, word_wrong_data, daily_study_log, updated_at
    ) values (
        v_account_id,
        coalesce(p_learning -> 'mastery_data', '{}'::jsonb),
        coalesce(p_learning -> 'srs_data', '{}'::jsonb),
        coalesce(p_learning -> 'total_stats', '{}'::jsonb),
        coalesce(p_learning -> 'unlocked_stickers', '{}'::jsonb),
        coalesce(p_learning -> 'curriculum_progress', '{}'::jsonb),
        coalesce(p_learning -> 'word_wrong_data', '{}'::jsonb),
        coalesce(p_learning -> 'daily_study_log', '{}'::jsonb),
        now()
    )
    on conflict (account_id) do update set
        mastery_data = account_learning_data.mastery_data || excluded.mastery_data,
        srs_data = account_learning_data.srs_data || excluded.srs_data,
        total_stats = public.jsonb_numeric_max_merge(account_learning_data.total_stats, excluded.total_stats),
        unlocked_stickers = account_learning_data.unlocked_stickers || excluded.unlocked_stickers,
        curriculum_progress = case
            when coalesce((excluded.curriculum_progress ->> 'completedDay')::integer, 0)
               >= coalesce((account_learning_data.curriculum_progress ->> 'completedDay')::integer, 0)
                then excluded.curriculum_progress
            else account_learning_data.curriculum_progress
        end,
        word_wrong_data = account_learning_data.word_wrong_data || excluded.word_wrong_data,
        daily_study_log = account_learning_data.daily_study_log || excluded.daily_study_log,
        updated_at = now();

    delete from public.account_backup_versions
    where account_id = v_account_id
      and id not in (
          select id from public.account_backup_versions
          where account_id = v_account_id
          order by created_at desc
          limit 10
      );

    return v_account_id;
end;
$$;

revoke all on function public.recompute_account_entitlement(uuid) from public;
revoke all on function public.record_verified_purchase(text, text, text, text, uuid, integer, text, timestamptz, timestamptz) from public;
revoke all on function public.get_my_entitlement() from public;
grant execute on function public.recompute_account_entitlement(uuid) to service_role;
grant execute on function public.record_verified_purchase(text, text, text, text, uuid, integer, text, timestamptz, timestamptz) to service_role;
grant execute on function public.get_my_entitlement() to authenticated;
