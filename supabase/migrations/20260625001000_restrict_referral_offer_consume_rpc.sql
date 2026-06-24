revoke all on function public.consume_referral_offer(uuid) from public;
revoke all on function public.consume_referral_offer(uuid) from anon;
revoke all on function public.consume_referral_offer(uuid) from authenticated;
grant execute on function public.consume_referral_offer(uuid) to service_role;
