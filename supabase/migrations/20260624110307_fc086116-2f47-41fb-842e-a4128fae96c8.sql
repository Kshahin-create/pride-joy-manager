
ALTER TABLE public.cleaning_contracts
  ADD COLUMN IF NOT EXISTS payment_method text;
