
CREATE OR REPLACE FUNCTION public.log_vendor_payment_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_actor UUID := auth.uid(); v_vendor TEXT;
BEGIN
  SELECT company_name INTO v_vendor FROM public.vendors WHERE id = NEW.vendor_id;
  INSERT INTO public.building_log(event_type, module, entity_id, description, metadata, actor_id, created_by)
  VALUES ('دفع مورد','vendor_payments',NEW.id,
    'تم سداد ' || to_char(NEW.amount,'FM999,999,990.00') || ' للمورد ' || COALESCE(v_vendor,'') ||
    ' (سند ' || COALESCE(NEW.payment_number,'') || ')',
    jsonb_build_object('vendor_id',NEW.vendor_id,'amount',NEW.amount,'expense_id',NEW.expense_id),
    v_actor, v_actor);

  IF NEW.expense_id IS NOT NULL THEN
    UPDATE public.expenses SET status = 'مدفوع', paid_at = now()
    WHERE id = NEW.expense_id AND status <> 'مدفوع';
  END IF;
  RETURN NEW;
END $$;
