create extension if not exists pgcrypto;

create table if not exists public.app_accounts (
    id uuid primary key default gen_random_uuid(),
    email_hash text not null unique,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.app_account_identities (
    auth_user_id uuid primary key references auth.users(id) on delete cascade,
    account_id uuid not null references public.app_accounts(id) on delete cascade,
    provider text,
    created_at timestamptz not null default now()
);

create index if not exists app_account_identities_account_idx
    on public.app_account_identities(account_id);

create table if not exists public.account_profiles (
    account_id uuid primary key references public.app_accounts(id) on delete cascade,
    nickname text not null default '한자학습자',
    character_type text default 'garae',
    xp integer not null default 0,
    level integer not null default 1,
    streak_count integer not null default 0,
    unlocked_pack integer not null default 0,
    is_premium boolean not null default false,
    last_active timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.account_learning_data (
    account_id uuid primary key references public.app_accounts(id) on delete cascade,
    mastery_data jsonb not null default '{}'::jsonb,
    srs_data jsonb not null default '{}'::jsonb,
    total_stats jsonb not null default '{}'::jsonb,
    unlocked_stickers jsonb not null default '{}'::jsonb,
    curriculum_progress jsonb not null default '{}'::jsonb,
    word_wrong_data jsonb not null default '{}'::jsonb,
    daily_study_log jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.account_backup_versions (
    id bigint generated always as identity primary key,
    account_id uuid not null references public.app_accounts(id) on delete cascade,
    profile_data jsonb,
    learning_data jsonb,
    created_at timestamptz not null default now()
);

create index if not exists account_backup_versions_account_created_idx
    on public.account_backup_versions(account_id, created_at desc);

create or replace function public.ensure_my_account()
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_uid uuid := auth.uid();
    v_email text;
    v_confirmed_at timestamptz;
    v_provider text;
    v_hash text;
    v_account_id uuid;
begin
    if v_uid is null then
        raise exception 'Authentication required' using errcode = '28000';
    end if;

    select account_id into v_account_id
    from public.app_account_identities
    where auth_user_id = v_uid;

    if v_account_id is not null then
        return v_account_id;
    end if;

    select email, email_confirmed_at, raw_app_meta_data ->> 'provider'
      into v_email, v_confirmed_at, v_provider
    from auth.users
    where id = v_uid;

    if v_email is null or v_confirmed_at is null then
        raise exception 'A verified email is required' using errcode = '28000';
    end if;

    v_hash := encode(extensions.digest(lower(trim(v_email)), 'sha256'), 'hex');

    insert into public.app_accounts(email_hash)
    values (v_hash)
    on conflict (email_hash) do update set updated_at = now()
    returning id into v_account_id;

    insert into public.app_account_identities(auth_user_id, account_id, provider)
    values (v_uid, v_account_id, v_provider)
    on conflict (auth_user_id) do nothing;

    return v_account_id;
end;
$$;

create or replace function public.current_account_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
    select account_id
    from public.app_account_identities
    where auth_user_id = auth.uid()
$$;

create or replace function public.jsonb_numeric_max_merge(a jsonb, b jsonb)
returns jsonb
language sql
immutable
as $$
    select coalesce(jsonb_object_agg(
        key,
        case
            when jsonb_typeof(av) = 'number' and jsonb_typeof(bv) = 'number'
                then to_jsonb(greatest((av #>> '{}')::numeric, (bv #>> '{}')::numeric))
            else coalesce(bv, av)
        end
    ), '{}'::jsonb)
    from (
        select coalesce(ak, bk) as key, av, bv
        from jsonb_each(coalesce(a, '{}'::jsonb)) ae(ak, av)
        full join jsonb_each(coalesce(b, '{}'::jsonb)) be(bk, bv) on ak = bk
    ) merged
$$;

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
        coalesce((p_profile ->> 'unlocked_pack')::integer, 0),
        coalesce((p_profile ->> 'is_premium')::boolean, false),
        now(), now()
    )
    on conflict (account_id) do update set
        nickname = case when excluded.xp >= account_profiles.xp then excluded.nickname else account_profiles.nickname end,
        character_type = case when excluded.xp >= account_profiles.xp then excluded.character_type else account_profiles.character_type end,
        xp = greatest(account_profiles.xp, excluded.xp),
        level = greatest(account_profiles.level, excluded.level),
        streak_count = greatest(account_profiles.streak_count, excluded.streak_count),
        unlocked_pack = greatest(account_profiles.unlocked_pack, excluded.unlocked_pack),
        is_premium = account_profiles.is_premium or excluded.is_premium,
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

create or replace function public.get_my_account_backup()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_account_id uuid;
    v_profile jsonb;
    v_learning jsonb;
begin
    v_account_id := public.ensure_my_account();
    select to_jsonb(p) - 'account_id' into v_profile
    from public.account_profiles p where account_id = v_account_id;
    select to_jsonb(l) - 'account_id' into v_learning
    from public.account_learning_data l where account_id = v_account_id;
    return jsonb_build_object('account_id', v_account_id, 'profile', v_profile, 'learning_data', v_learning);
end;
$$;

-- Backfill one internal account per verified, normalized email.
insert into public.app_accounts(email_hash)
select distinct encode(extensions.digest(lower(trim(email)), 'sha256'), 'hex')
from auth.users
where email is not null and email_confirmed_at is not null
on conflict (email_hash) do nothing;

insert into public.app_account_identities(auth_user_id, account_id, provider)
select u.id, a.id, u.raw_app_meta_data ->> 'provider'
from auth.users u
join public.app_accounts a
  on a.email_hash = encode(extensions.digest(lower(trim(u.email)), 'sha256'), 'hex')
where u.email is not null and u.email_confirmed_at is not null
on conflict (auth_user_id) do nothing;

insert into public.account_profiles(
    account_id, nickname, character_type, xp, level, streak_count,
    unlocked_pack, is_premium, last_active, created_at, updated_at
)
select distinct on (i.account_id)
    i.account_id, p.nickname, p.character_type, p.xp, p.level, p.streak_count,
    coalesce(p.unlocked_pack, 0), coalesce(p.is_premium, false),
    coalesce(p.last_active, now()), coalesce(p.created_at, now()), coalesce(p.updated_at, now())
from public.user_profiles p
join public.app_account_identities i on i.auth_user_id = p.auth_user_id
order by i.account_id, p.xp desc, p.updated_at desc
on conflict (account_id) do nothing;

insert into public.account_learning_data(
    account_id, mastery_data, srs_data, total_stats, unlocked_stickers,
    curriculum_progress, word_wrong_data, daily_study_log, updated_at
)
select distinct on (i.account_id)
    i.account_id, l.mastery_data, l.srs_data, l.total_stats, l.unlocked_stickers,
    l.curriculum_progress, l.word_wrong_data, l.daily_study_log, l.updated_at
from public.learning_data l
join public.app_account_identities i on i.auth_user_id = l.auth_user_id
order by i.account_id,
    (length(coalesce(l.mastery_data, '{}'::jsonb)::text) * 1000
     + length(coalesce(l.daily_study_log, '{}'::jsonb)::text) * 100
     + length(coalesce(l.total_stats, '{}'::jsonb)::text)) desc,
    l.updated_at desc
on conflict (account_id) do nothing;

alter table public.app_accounts enable row level security;
alter table public.app_account_identities enable row level security;
alter table public.account_profiles enable row level security;
alter table public.account_learning_data enable row level security;
alter table public.account_backup_versions enable row level security;

create policy "read own identity" on public.app_account_identities
    for select to authenticated using (auth_user_id = auth.uid());
create policy "read own profile" on public.account_profiles
    for select to authenticated using (account_id = public.current_account_id());
create policy "read own learning data" on public.account_learning_data
    for select to authenticated using (account_id = public.current_account_id());
create policy "read own backup versions" on public.account_backup_versions
    for select to authenticated using (account_id = public.current_account_id());

create or replace view public.account_leaderboard as
select
    account_id,
    nickname,
    character_type,
    xp,
    level,
    streak_count,
    row_number() over (order by xp desc) as rank
from public.account_profiles
order by xp desc
limit 100;

revoke all on public.app_accounts from anon, authenticated;
revoke all on public.app_account_identities from anon;
revoke all on public.account_profiles from anon;
revoke all on public.account_learning_data from anon;
revoke all on public.account_backup_versions from anon;
grant select on public.app_account_identities, public.account_profiles,
    public.account_learning_data, public.account_backup_versions to authenticated;
grant select on public.account_leaderboard to anon, authenticated;

revoke all on function public.ensure_my_account() from public;
revoke all on function public.get_my_account_backup() from public;
revoke all on function public.sync_my_account_data(jsonb, jsonb) from public;
grant execute on function public.ensure_my_account() to authenticated;
grant execute on function public.get_my_account_backup() to authenticated;
grant execute on function public.sync_my_account_data(jsonb, jsonb) to authenticated;
