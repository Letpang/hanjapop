revoke all on function public.record_verified_purchase(
    text,
    text,
    text,
    text,
    uuid,
    integer,
    text,
    timestamptz,
    timestamptz
) from public;
revoke all on function public.record_verified_purchase(
    text,
    text,
    text,
    text,
    uuid,
    integer,
    text,
    timestamptz,
    timestamptz
) from anon;
revoke all on function public.record_verified_purchase(
    text,
    text,
    text,
    text,
    uuid,
    integer,
    text,
    timestamptz,
    timestamptz
) from authenticated;
grant execute on function public.record_verified_purchase(
    text,
    text,
    text,
    text,
    uuid,
    integer,
    text,
    timestamptz,
    timestamptz
) to service_role;

revoke all on function public.recompute_account_entitlement(uuid) from public;
revoke all on function public.recompute_account_entitlement(uuid) from anon;
revoke all on function public.recompute_account_entitlement(uuid) from authenticated;
grant execute on function public.recompute_account_entitlement(uuid) to service_role;

revoke all on function public.get_my_entitlement() from public;
revoke all on function public.get_my_entitlement() from anon;
grant execute on function public.get_my_entitlement() to authenticated;
