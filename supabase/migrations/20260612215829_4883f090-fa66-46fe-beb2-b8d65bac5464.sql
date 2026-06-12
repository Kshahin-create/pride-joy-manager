REVOKE EXECUTE ON FUNCTION public.get_daily_report(DATE) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_report(DATE) TO authenticated;