
ALTER TABLE public.cleaning_plans ADD COLUMN IF NOT EXISTS archived_at timestamptz, ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE public.cameras ADD COLUMN IF NOT EXISTS archived_at timestamptz, ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE public.guards ADD COLUMN IF NOT EXISTS archived_at timestamptz, ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE public.patrols ADD COLUMN IF NOT EXISTS archived_at timestamptz, ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE public.security_incidents ADD COLUMN IF NOT EXISTS archived_at timestamptz, ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE public.pm_plans ADD COLUMN IF NOT EXISTS archived_at timestamptz, ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE public.parking_maintenance_checks ADD COLUMN IF NOT EXISTS archived_at timestamptz, ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE public.parking_cleaning_logs ADD COLUMN IF NOT EXISTS archived_at timestamptz, ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE public.parking_violations ADD COLUMN IF NOT EXISTS archived_at timestamptz, ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE public.visitors ADD COLUMN IF NOT EXISTS archived_at timestamptz, ADD COLUMN IF NOT EXISTS archived_by uuid;
