CREATE OR REPLACE FUNCTION public._is_archivable_table(_table text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public._module_for_table(_table) IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns c
       WHERE c.table_schema='public' AND c.table_name=_table AND c.column_name='archived_at'
     );
$$;

CREATE OR REPLACE FUNCTION public._is_deletable_table(_table text)
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public._module_for_table(_table) IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.delete_record(_table text, _id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_name text; v_uid uuid := auth.uid(); v_mod text;
BEGIN
  IF NOT public._is_deletable_table(_table) THEN
    RAISE EXCEPTION 'الجدول غير مسموح بحذفه';
  END IF;
  v_mod := public._module_for_table(_table);
  IF NOT (
    public.has_role(v_uid,'super_admin')
    OR public.has_permission(v_uid,'records.purge')
    OR (v_mod IS NOT NULL AND public.has_permission(v_uid, v_mod || '.delete'))
  ) THEN
    RAISE EXCEPTION 'لا تملك صلاحية الحذف';
  END IF;
  v_name := public._entity_display_name(_table, _id);
  INSERT INTO public.audit_log (entity_type, entity_id, entity_name, action, actor_id, reason)
  VALUES (_table, _id, v_name, 'delete', v_uid, _reason);
  BEGIN
    EXECUTE format('DELETE FROM public.%I WHERE id = $1', _table) USING _id;
  EXCEPTION WHEN foreign_key_violation THEN
    DELETE FROM public.audit_log
      WHERE entity_type=_table AND entity_id=_id AND action='delete' AND actor_id=v_uid
      AND created_at > now() - interval '5 seconds';
    RAISE EXCEPTION 'لا يمكن حذف هذا العنصر لأنه مرتبط ببيانات أخرى. يمكنك أرشفته بدلاً من حذفه.';
  END;
END $$;
