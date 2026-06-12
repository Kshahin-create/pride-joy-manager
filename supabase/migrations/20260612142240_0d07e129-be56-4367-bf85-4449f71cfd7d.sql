
-- تقييد سياسة الإدراج في سجل البرج
DROP POLICY IF EXISTS "إدراج في سجل البرج" ON public.building_log;
CREATE POLICY "إدراج في سجل البرج" ON public.building_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- تقييد صلاحيات تنفيذ دوال SECURITY DEFINER
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_roles() FROM PUBLIC, anon;
