UPDATE public.parking_spots
SET spot_number = floor || '-' || lpad(substring(spot_number from length(floor)+1), 2, '0')
WHERE spot_number !~ '-';

UPDATE public.offices
SET code = 'F' || floor::text || '-' || lpad(office_number, 2, '0')
WHERE code !~ '-';
