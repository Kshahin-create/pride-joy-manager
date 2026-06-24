
-- 1) Asset specs (JSONB), vendor link, polymorphic maintenance contract link
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS supplier_vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS maintenance_contract_type TEXT,
  ADD COLUMN IF NOT EXISTS maintenance_contract_id UUID;

CREATE INDEX IF NOT EXISTS idx_assets_supplier_vendor ON public.assets(supplier_vendor_id);
CREATE INDEX IF NOT EXISTS idx_assets_maint_contract ON public.assets(maintenance_contract_type, maintenance_contract_id);

-- 2) Trigger: when maintenance_requests closes with an asset, sync last/next maintenance dates
CREATE OR REPLACE FUNCTION public.sync_asset_maintenance_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_done_date DATE;
  v_freq public.asset_maintenance_frequency;
  v_custom INT;
  v_next DATE;
BEGIN
  IF NEW.asset_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status <> 'مغلق' OR OLD.status = 'مغلق' THEN RETURN NEW; END IF;

  v_done_date := COALESCE(NEW.closed_at::date, CURRENT_DATE);

  SELECT maintenance_frequency, custom_frequency_days
    INTO v_freq, v_custom
  FROM public.assets WHERE id = NEW.asset_id;

  v_next := CASE v_freq
    WHEN 'شهري'      THEN v_done_date + INTERVAL '30 days'
    WHEN 'كل 3 أشهر' THEN v_done_date + INTERVAL '90 days'
    WHEN 'كل 6 أشهر' THEN v_done_date + INTERVAL '180 days'
    WHEN 'سنوي'      THEN v_done_date + INTERVAL '365 days'
    WHEN 'مدة مخصصة' THEN v_done_date + (COALESCE(v_custom,30) || ' days')::interval
    ELSE NULL
  END;

  UPDATE public.assets
  SET last_maintenance_date = v_done_date,
      next_maintenance_date = COALESCE(v_next, next_maintenance_date),
      updated_at = now()
  WHERE id = NEW.asset_id;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_asset_maint_dates ON public.maintenance_requests;
CREATE TRIGGER trg_sync_asset_maint_dates
AFTER UPDATE OF status ON public.maintenance_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_asset_maintenance_dates();
