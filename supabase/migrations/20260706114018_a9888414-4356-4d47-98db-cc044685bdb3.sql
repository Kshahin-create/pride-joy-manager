ALTER TABLE public.building_identity
  ADD COLUMN IF NOT EXISTS overhead_tank_count integer,
  ADD COLUMN IF NOT EXISTS overhead_tank_capacity_per_unit integer,
  ADD COLUMN IF NOT EXISTS overhead_tank_type text,
  ADD COLUMN IF NOT EXISTS overhead_tank_area_sqm integer,
  ADD COLUMN IF NOT EXISTS overhead_tank_height_m integer,
  ADD COLUMN IF NOT EXISTS overhead_fire_pump_tank_count integer,
  ADD COLUMN IF NOT EXISTS underground_concrete_tanks_notes text;