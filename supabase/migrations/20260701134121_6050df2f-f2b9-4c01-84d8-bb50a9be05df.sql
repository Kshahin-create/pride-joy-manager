
-- 1) Add archive columns
DO $$
DECLARE t text;
tables text[] := ARRAY[
  'assets','asset_types','employees','vendors','companies','contracts',
  'cleaning_contracts','ac_contracts','elevator_contracts','fire_contracts','supply_contracts',
  'tickets','maintenance_requests','invoices','documents','offices','parking_spots','spaces',
  'employee_employers','employee_departments'
];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I
      ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS archived_by UUID,
      ADD COLUMN IF NOT EXISTS archive_reason TEXT', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (archived_at) WHERE archived_at IS NOT NULL',
      t || '_archived_at_idx', t);
  END LOOP;
END $$;

-- 2) Audit log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_name TEXT,
  action TEXT NOT NULL CHECK (action IN ('archive','restore','delete')),
  actor_id UUID,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_log_entity_idx ON public.audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_log_created_idx ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON public.audit_log(actor_id);
GRANT SELECT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Super admin reads audit log" ON public.audit_log;
CREATE POLICY "Super admin reads audit log" ON public.audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'));

-- 3) Register new permissions
INSERT INTO public.app_permissions (key, module, module_label, action, label, description, sort_order)
VALUES
  ('records.archive','records','السجلات','archive','أرشفة السجلات','أرشفة/تعطيل عناصر النظام',900),
  ('records.restore','records','السجلات','restore','استعادة السجلات','استعادة عناصر مؤرشفة',901),
  ('records.delete','records','السجلات','delete','حذف نهائي','حذف نهائي للسجلات',902)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_key)
SELECT r.id, p.key
FROM public.app_roles r
CROSS JOIN (VALUES ('records.archive'),('records.restore'),('records.delete')) AS p(key)
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- 4) Whitelist
CREATE OR REPLACE FUNCTION public._is_archivable_table(_table text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT _table = ANY (ARRAY[
    'assets','asset_types','employees','vendors','companies','contracts',
    'cleaning_contracts','ac_contracts','elevator_contracts','fire_contracts','supply_contracts',
    'tickets','maintenance_requests','invoices','documents','offices','parking_spots','spaces',
    'employee_employers','employee_departments'
  ])
$$;

-- 5) Best-effort display name
CREATE OR REPLACE FUNCTION public._entity_display_name(_table text, _id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE v_col text; v_val text;
BEGIN
  SELECT column_name INTO v_col
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name=_table
    AND column_name IN ('full_name','company_name','asset_name','name','title',
      'contract_number','invoice_number','request_number','ticket_number',
      'code','space_name','plate_number')
  ORDER BY array_position(ARRAY['full_name','company_name','asset_name','name','title',
      'contract_number','invoice_number','request_number','ticket_number',
      'code','space_name','plate_number'], column_name)
  LIMIT 1;
  IF v_col IS NULL THEN RETURN _id::text; END IF;
  EXECUTE format('SELECT %I::text FROM public.%I WHERE id=$1', v_col, _table)
    INTO v_val USING _id;
  RETURN COALESCE(v_val, _id::text);
END $$;

-- 6) archive_record
CREATE OR REPLACE FUNCTION public.archive_record(_table text, _id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_uid uuid := auth.uid();
BEGIN
  IF NOT public._is_archivable_table(_table) THEN
    RAISE EXCEPTION 'الجدول غير مسموح بأرشفته';
  END IF;
  IF NOT (public.has_permission(v_uid,'records.archive') OR public.has_role(v_uid,'super_admin')) THEN
    RAISE EXCEPTION 'لا تملك صلاحية الأرشفة';
  END IF;
  v_name := public._entity_display_name(_table, _id);
  EXECUTE format('UPDATE public.%I SET archived_at = now(), archived_by = $1, archive_reason = $2 WHERE id = $3 AND archived_at IS NULL', _table)
    USING v_uid, _reason, _id;
  INSERT INTO public.audit_log (entity_type, entity_id, entity_name, action, actor_id, reason)
  VALUES (_table, _id, v_name, 'archive', v_uid, _reason);
END $$;

-- 7) restore_record
CREATE OR REPLACE FUNCTION public.restore_record(_table text, _id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_uid uuid := auth.uid();
BEGIN
  IF NOT public._is_archivable_table(_table) THEN
    RAISE EXCEPTION 'الجدول غير مسموح باستعادته';
  END IF;
  IF NOT (public.has_permission(v_uid,'records.restore') OR public.has_role(v_uid,'super_admin')) THEN
    RAISE EXCEPTION 'لا تملك صلاحية الاستعادة';
  END IF;
  v_name := public._entity_display_name(_table, _id);
  EXECUTE format('UPDATE public.%I SET archived_at = NULL, archived_by = NULL, archive_reason = NULL WHERE id = $1', _table)
    USING _id;
  INSERT INTO public.audit_log (entity_type, entity_id, entity_name, action, actor_id)
  VALUES (_table, _id, v_name, 'restore', v_uid);
END $$;

-- 8) delete_record
CREATE OR REPLACE FUNCTION public.delete_record(_table text, _id uuid, _reason text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name text; v_uid uuid := auth.uid();
BEGIN
  IF NOT public._is_archivable_table(_table) THEN
    RAISE EXCEPTION 'الجدول غير مسموح بحذفه';
  END IF;
  IF NOT (public.has_permission(v_uid,'records.delete') OR public.has_role(v_uid,'super_admin')) THEN
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

GRANT EXECUTE ON FUNCTION public.archive_record(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_record(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_record(text, uuid, text) TO authenticated;
