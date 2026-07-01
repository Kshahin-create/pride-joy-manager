
CREATE OR REPLACE FUNCTION public._is_archivable_table(_table text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path TO 'public' AS $$
  SELECT _table = ANY (ARRAY[
    'assets','asset_types','employees','vendors','companies','contracts',
    'cleaning_contracts','ac_contracts','elevator_contracts','fire_contracts','supply_contracts',
    'tickets','maintenance_requests','invoices','documents','offices','parking_spots','spaces',
    'employee_employers','employee_departments',
    'cleaning_plans','cameras','guards','patrols','security_incidents','pm_plans',
    'parking_maintenance_checks','parking_cleaning_logs','parking_violations','visitors'
  ])
$$;
