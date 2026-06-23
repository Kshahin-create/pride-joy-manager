CREATE OR REPLACE FUNCTION public.validate_wo_closure()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'مغلق' AND (OLD.status IS DISTINCT FROM 'مغلق') THEN
    IF OLD.status <> 'مكتمل مبدئياً' AND NOT public.has_role(auth.uid(),'super_admin') THEN
      RAISE EXCEPTION 'يجب أن يصل أمر العمل إلى حالة "مكتمل مبدئياً" قبل الاعتماد والإغلاق';
    END IF;
  END IF;
  IF NEW.status = 'معلّق' AND (NEW.hold_reason IS NULL OR length(trim(NEW.hold_reason)) = 0) THEN
    RAISE EXCEPTION 'سبب التعليق مطلوب عند تعليق أمر العمل';
  END IF;
  RETURN NEW;
END $function$;