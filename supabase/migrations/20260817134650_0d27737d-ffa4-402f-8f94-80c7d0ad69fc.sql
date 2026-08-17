CREATE OR REPLACE FUNCTION public._module_for_table(_t text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE _t
    WHEN 'cleaning_plans' THEN 'cleaning'
    WHEN 'cleaning_logs' THEN 'cleaning'
    WHEN 'cleaning_contracts' THEN 'cleaning'
    WHEN 'parking_spots' THEN 'parking'
    WHEN 'parking_violations' THEN 'parking'
    WHEN 'parking_cleaning_logs' THEN 'parking'
    WHEN 'parking_maintenance_checks' THEN 'parking'
    WHEN 'maintenance_requests' THEN 'maintenance'
    WHEN 'security_incidents' THEN 'incidents'
    WHEN 'patrols' THEN 'patrols'
    WHEN 'guards' THEN 'guards'
    WHEN 'assets' THEN 'assets'
    WHEN 'contracts' THEN 'contracts'
    WHEN 'offices' THEN 'offices'
    WHEN 'companies' THEN 'tenants'
    WHEN 'expenses' THEN 'expenses'
    WHEN 'invoices' THEN 'invoices'
    WHEN 'payments' THEN 'payments'
    WHEN 'documents' THEN 'documents'
    WHEN 'employees' THEN 'employees'
    WHEN 'vendors' THEN 'vendors'
    WHEN 'vendor_payments' THEN 'vendor_payments'
    WHEN 'visitors' THEN 'visitors'
    WHEN 'inspections' THEN 'inspections'
    WHEN 'pm_plans' THEN 'pm_plans'
    WHEN 'spaces' THEN 'spaces'
    WHEN 'cameras' THEN 'cameras'
    WHEN 'network_points' THEN 'network_points'
    WHEN 'electricity_meters' THEN 'electricity'
    WHEN 'ac_units' THEN 'ac_units'
    WHEN 'building_log' THEN 'building_log'
    WHEN 'tickets' THEN 'tickets'
    ELSE NULL
  END
$$;

CREATE OR REPLACE FUNCTION public.delete_record(_table text, _id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_uid uuid := auth.uid(); v_mod text;
BEGIN
  IF NOT public._is_archivable_table(_table) THEN
    RAISE EXCEPTION 'الجدول غير مسموح بحذفه';
  END IF;
  v_mod := public._module_for_table(_table);
  IF NOT (
    public.has_permission(v_uid,'records.delete')
    OR public.has_role(v_uid,'super_admin')
    OR (v_mod IS NOT NULL AND public.has_permission(v_uid, v_mod || '.delete'))
  ) THEN
    RAISE EXCEPTION 'لا تملك صلاحية الحذف النهائي';
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

CREATE OR REPLACE FUNCTION public.archive_record(_table text, _id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_uid uuid := auth.uid(); v_mod text;
BEGIN
  IF NOT public._is_archivable_table(_table) THEN
    RAISE EXCEPTION 'الجدول غير مسموح بأرشفته';
  END IF;
  v_mod := public._module_for_table(_table);
  IF NOT (
    public.has_permission(v_uid,'records.archive')
    OR public.has_role(v_uid,'super_admin')
    OR (v_mod IS NOT NULL AND (
      public.has_permission(v_uid, v_mod || '.delete')
      OR public.has_permission(v_uid, v_mod || '.manage')
    ))
  ) THEN
    RAISE EXCEPTION 'لا تملك صلاحية الأرشفة';
  END IF;
  v_name := public._entity_display_name(_table, _id);
  EXECUTE format('UPDATE public.%I SET archived_at = now(), archived_by = $1, archive_reason = $2 WHERE id = $3 AND archived_at IS NULL', _table)
    USING v_uid, _reason, _id;
  INSERT INTO public.audit_log (entity_type, entity_id, entity_name, action, actor_id, reason)
  VALUES (_table, _id, v_name, 'archive', v_uid, _reason);
END $$;

CREATE OR REPLACE FUNCTION public.restore_record(_table text, _id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_uid uuid := auth.uid(); v_mod text;
BEGIN
  IF NOT public._is_archivable_table(_table) THEN
    RAISE EXCEPTION 'الجدول غير مسموح باستعادته';
  END IF;
  v_mod := public._module_for_table(_table);
  IF NOT (
    public.has_permission(v_uid,'records.restore')
    OR public.has_role(v_uid,'super_admin')
    OR (v_mod IS NOT NULL AND (
      public.has_permission(v_uid, v_mod || '.delete')
      OR public.has_permission(v_uid, v_mod || '.manage')
    ))
  ) THEN
    RAISE EXCEPTION 'لا تملك صلاحية الاستعادة';
  END IF;
  v_name := public._entity_display_name(_table, _id);
  EXECUTE format('UPDATE public.%I SET archived_at = NULL, archived_by = NULL, archive_reason = NULL WHERE id = $1', _table) USING _id;
  INSERT INTO public.audit_log (entity_type, entity_id, entity_name, action, actor_id)
  VALUES (_table, _id, v_name, 'restore', v_uid);
END $$;