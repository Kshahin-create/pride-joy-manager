DO $do$
DECLARE b record; pol record;
BEGIN
  -- remove every non-avatar policy on storage.objects
  FOR pol IN SELECT policyname, coalesce(qual,'')||coalesce(with_check,'') AS expr
             FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
  LOOP
    IF pol.expr NOT LIKE '%avatars%' THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END IF;
  END LOOP;

  FOR b IN SELECT * FROM (VALUES
      ('asset-photos','assets'),
      ('cleaning-photos','cleaning'),
      ('cleaning-contracts','cleaning'),
      ('companies','tenants'),
      ('contracts','contracts'),
      ('documents','documents'),
      ('expense-attachments','expenses'),
      ('guards-photos','guards'),
      ('incident-photos','incidents'),
      ('inspection-photos','inspections'),
      ('maintenance-photos','maintenance'),
      ('office-files','offices'),
      ('parking-photos','parking'),
      ('patrol-photos','patrols'),
      ('payment-receipts','payments')
    ) AS t(bucket, moduleq)
  LOOP
    EXECUTE format($f$CREATE POLICY %I ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = %L AND public.can_view_module(auth.uid(), %L))$f$,
      b.bucket||'_perm_select', b.bucket, b.moduleq);
    EXECUTE format($f$CREATE POLICY %I ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = %L AND public.can_upload_module(auth.uid(), %L))$f$,
      b.bucket||'_perm_insert', b.bucket, b.moduleq);
    EXECUTE format($f$CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = %L AND public.can_upload_module(auth.uid(), %L))
      WITH CHECK (bucket_id = %L AND public.can_upload_module(auth.uid(), %L))$f$,
      b.bucket||'_perm_update', b.bucket, b.moduleq, b.bucket, b.moduleq);
    EXECUTE format($f$CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = %L AND public.can_delete_files(auth.uid(), %L))$f$,
      b.bucket||'_perm_delete', b.bucket, b.moduleq);
  END LOOP;
END $do$;

-- helpers no longer rely on removed generic keys
CREATE OR REPLACE FUNCTION public.can_delete_files(_uid uuid, _mod text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_role(_uid,'super_admin')
        OR public.has_permission(_uid, _mod || '.file_delete')
        OR public.has_permission(_uid, _mod || '.delete')
        OR public.has_permission(_uid, _mod || '.edit') $$;

CREATE OR REPLACE FUNCTION public.can_upload_module(_uid uuid, _mod text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_role(_uid,'super_admin')
        OR public.has_permission(_uid, _mod || '.upload')
        OR public.has_permission(_uid, _mod || '.create')
        OR public.has_permission(_uid, _mod || '.edit') $$;

CREATE OR REPLACE FUNCTION public.can_view_module(_uid uuid, _mod text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT public.has_role(_uid,'super_admin')
        OR public.has_permission(_uid, _mod || '.view')
        OR public.has_permission(_uid, _mod || '.edit')
        OR public.has_permission(_uid, _mod || '.create')
        OR public.has_permission(_uid, _mod || '.upload') $$;

-- archive/restore follow module permissions too
CREATE OR REPLACE FUNCTION public.archive_record(_table text, _id uuid, _reason text DEFAULT NULL::text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_mod text; v_name text;
BEGIN
  IF NOT public._is_archivable_table(_table) THEN RAISE EXCEPTION 'الجدول غير مسموح بأرشفته'; END IF;
  v_mod := public._module_for_table(_table);
  IF NOT (public.has_role(v_uid,'super_admin') OR public.has_permission(v_uid,'records.archive')
          OR (v_mod IS NOT NULL AND (public.has_permission(v_uid, v_mod||'.delete') OR public.has_permission(v_uid, v_mod||'.edit')))) THEN
    RAISE EXCEPTION 'لا تملك صلاحية الأرشفة';
  END IF;
  v_name := public._entity_display_name(_table, _id);
  EXECUTE format('UPDATE public.%I SET archived_at = now(), archived_by = $1 WHERE id = $2', _table) USING v_uid, _id;
  INSERT INTO public.audit_log (entity_type, entity_id, entity_name, action, actor_id, reason)
  VALUES (_table, _id, v_name, 'archive', v_uid, _reason);
END $function$;

CREATE OR REPLACE FUNCTION public.restore_record(_table text, _id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_uid uuid := auth.uid(); v_mod text; v_name text;
BEGIN
  IF NOT public._is_archivable_table(_table) THEN RAISE EXCEPTION 'الجدول غير مسموح باستعادته'; END IF;
  v_mod := public._module_for_table(_table);
  IF NOT (public.has_role(v_uid,'super_admin') OR public.has_permission(v_uid,'records.restore')
          OR (v_mod IS NOT NULL AND (public.has_permission(v_uid, v_mod||'.delete') OR public.has_permission(v_uid, v_mod||'.edit')))) THEN
    RAISE EXCEPTION 'لا تملك صلاحية الاستعادة';
  END IF;
  v_name := public._entity_display_name(_table, _id);
  EXECUTE format('UPDATE public.%I SET archived_at = NULL, archived_by = NULL WHERE id = $1', _table) USING _id;
  INSERT INTO public.audit_log (entity_type, entity_id, entity_name, action, actor_id)
  VALUES (_table, _id, v_name, 'restore', v_uid);
END $function$;