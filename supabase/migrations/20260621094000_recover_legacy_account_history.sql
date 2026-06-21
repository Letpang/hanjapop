-- Recover learning history that was split across legacy auth/device rows.
-- The initial account backfill selected one "best" learning row.  That kept
-- the largest body of data, but could omit study dates stored in other rows.

create or replace function public.jsonb_deep_max_merge(a jsonb, b jsonb)
returns jsonb
language plpgsql
immutable
as $$
declare
    v_result jsonb := coalesce(a, '{}'::jsonb);
    v_key text;
    v_value jsonb;
    v_existing jsonb;
begin
    if jsonb_typeof(coalesce(a, '{}'::jsonb)) <> 'object'
       or jsonb_typeof(coalesce(b, '{}'::jsonb)) <> 'object' then
        if jsonb_typeof(a) = 'number' and jsonb_typeof(b) = 'number' then
            return to_jsonb(greatest((a #>> '{}')::numeric, (b #>> '{}')::numeric));
        end if;
        return coalesce(b, a);
    end if;

    for v_key, v_value in select key, value from jsonb_each(coalesce(b, '{}'::jsonb))
    loop
        v_existing := v_result -> v_key;
        if jsonb_typeof(v_existing) = 'object' and jsonb_typeof(v_value) = 'object' then
            v_result := jsonb_set(v_result, array[v_key], public.jsonb_deep_max_merge(v_existing, v_value), true);
        elsif jsonb_typeof(v_existing) = 'number' and jsonb_typeof(v_value) = 'number' then
            v_result := jsonb_set(
                v_result,
                array[v_key],
                to_jsonb(greatest((v_existing #>> '{}')::numeric, (v_value #>> '{}')::numeric)),
                true
            );
        else
            v_result := jsonb_set(v_result, array[v_key], v_value, true);
        end if;
    end loop;
    return v_result;
end;
$$;

create or replace function public.recover_my_legacy_account_data()
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    v_account_id uuid;
    v_current_profile public.account_profiles%rowtype;
    v_current_learning public.account_learning_data%rowtype;
    v_row public.learning_data%rowtype;
    v_mastery jsonb := '{}'::jsonb;
    v_srs jsonb := '{}'::jsonb;
    v_total jsonb := '{}'::jsonb;
    v_stickers jsonb := '{}'::jsonb;
    v_wrong jsonb := '{}'::jsonb;
    v_days jsonb := '{}'::jsonb;
    v_legacy_rows integer := 0;
    v_before_days integer := 0;
    v_after_days integer := 0;
    v_changed boolean := false;
begin
    v_account_id := public.ensure_my_account();

    select * into v_current_profile
    from public.account_profiles
    where account_id = v_account_id;

    select * into v_current_learning
    from public.account_learning_data
    where account_id = v_account_id;

    for v_row in
        select l.*
        from public.learning_data l
        join public.app_account_identities i on i.auth_user_id = l.auth_user_id
        where i.account_id = v_account_id
        order by l.updated_at asc nulls first
    loop
        v_legacy_rows := v_legacy_rows + 1;
        v_mastery := public.jsonb_deep_max_merge(v_mastery, coalesce(v_row.mastery_data, '{}'::jsonb));
        v_srs := public.jsonb_deep_max_merge(v_srs, coalesce(v_row.srs_data, '{}'::jsonb));
        v_total := public.jsonb_deep_max_merge(v_total, coalesce(v_row.total_stats, '{}'::jsonb));
        v_stickers := public.jsonb_deep_max_merge(v_stickers, coalesce(v_row.unlocked_stickers, '{}'::jsonb));
        v_wrong := public.jsonb_deep_max_merge(v_wrong, coalesce(v_row.word_wrong_data, '{}'::jsonb));
        v_days := public.jsonb_deep_max_merge(v_days, coalesce(v_row.daily_study_log, '{}'::jsonb));
    end loop;

    if v_current_learning.account_id is not null then
        v_before_days := coalesce(jsonb_object_length(coalesce(v_current_learning.daily_study_log, '{}'::jsonb)), 0);
        -- Current account values win for non-numeric conflicts; numeric counters keep the maximum.
        v_mastery := public.jsonb_deep_max_merge(v_mastery, v_current_learning.mastery_data);
        v_srs := public.jsonb_deep_max_merge(v_srs, v_current_learning.srs_data);
        v_total := public.jsonb_deep_max_merge(v_total, v_current_learning.total_stats);
        v_stickers := public.jsonb_deep_max_merge(v_stickers, v_current_learning.unlocked_stickers);
        v_wrong := public.jsonb_deep_max_merge(v_wrong, v_current_learning.word_wrong_data);
        v_days := public.jsonb_deep_max_merge(v_days, v_current_learning.daily_study_log);
    end if;

    v_after_days := coalesce(jsonb_object_length(v_days), 0);
    v_changed := v_current_learning.account_id is null
        or v_mastery is distinct from v_current_learning.mastery_data
        or v_srs is distinct from v_current_learning.srs_data
        or v_total is distinct from v_current_learning.total_stats
        or v_stickers is distinct from v_current_learning.unlocked_stickers
        or v_wrong is distinct from v_current_learning.word_wrong_data
        or v_days is distinct from v_current_learning.daily_study_log;

    if v_changed and (v_current_profile.account_id is not null or v_current_learning.account_id is not null) then
        insert into public.account_backup_versions(account_id, profile_data, learning_data)
        values (
            v_account_id,
            case when v_current_profile.account_id is null then null else to_jsonb(v_current_profile) end,
            case when v_current_learning.account_id is null then null else to_jsonb(v_current_learning) end
        );
    end if;

    if v_changed then
        insert into public.account_learning_data(
            account_id, mastery_data, srs_data, total_stats, unlocked_stickers,
            curriculum_progress, word_wrong_data, daily_study_log, updated_at
        ) values (
            v_account_id, v_mastery, v_srs, v_total, v_stickers,
            coalesce(v_current_learning.curriculum_progress, '{}'::jsonb),
            v_wrong, v_days, now()
        )
        on conflict (account_id) do update set
            mastery_data = excluded.mastery_data,
            srs_data = excluded.srs_data,
            total_stats = excluded.total_stats,
            unlocked_stickers = excluded.unlocked_stickers,
            word_wrong_data = excluded.word_wrong_data,
            daily_study_log = excluded.daily_study_log,
            updated_at = now();
    end if;

    -- Recover profile maxima too, without replacing the current nickname/character.
    update public.account_profiles p
    set xp = greatest(p.xp, coalesce(x.max_xp, 0)),
        level = greatest(p.level, coalesce(x.max_level, 1)),
        streak_count = greatest(p.streak_count, coalesce(x.max_streak, 0)),
        unlocked_pack = greatest(p.unlocked_pack, coalesce(x.max_pack, 0)),
        is_premium = p.is_premium or coalesce(x.any_premium, false),
        updated_at = case
            when p.xp < coalesce(x.max_xp, 0)
              or p.level < coalesce(x.max_level, 1)
              or p.streak_count < coalesce(x.max_streak, 0)
              or p.unlocked_pack < coalesce(x.max_pack, 0)
              or (not p.is_premium and coalesce(x.any_premium, false)) then now()
            else p.updated_at
        end
    from (
        select i.account_id,
               max(up.xp) as max_xp,
               max(up.level) as max_level,
               max(up.streak_count) as max_streak,
               max(coalesce(up.unlocked_pack, 0)) as max_pack,
               bool_or(coalesce(up.is_premium, false)) as any_premium
        from public.user_profiles up
        join public.app_account_identities i on i.auth_user_id = up.auth_user_id
        where i.account_id = v_account_id
        group by i.account_id
    ) x
    where p.account_id = x.account_id;

    delete from public.account_backup_versions
    where account_id = v_account_id
      and id not in (
          select id from public.account_backup_versions
          where account_id = v_account_id
          order by created_at desc
          limit 3
      );

    return jsonb_build_object(
        'legacy_rows', v_legacy_rows,
        'study_days_before', v_before_days,
        'study_days_after', v_after_days,
        'changed', v_changed
    );
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
    v_recovery jsonb;
begin
    v_account_id := public.ensure_my_account();
    v_recovery := public.recover_my_legacy_account_data();

    select to_jsonb(p) - 'account_id' into v_profile
    from public.account_profiles p where account_id = v_account_id;
    select to_jsonb(l) - 'account_id' into v_learning
    from public.account_learning_data l where account_id = v_account_id;

    return jsonb_build_object(
        'account_id', v_account_id,
        'profile', v_profile,
        'learning_data', v_learning,
        'legacy_recovery', v_recovery
    );
end;
$$;

revoke all on function public.jsonb_deep_max_merge(jsonb, jsonb) from public;
revoke all on function public.recover_my_legacy_account_data() from public;
grant execute on function public.recover_my_legacy_account_data() to authenticated;
