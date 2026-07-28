
-- Helper macro-like: additive permission policies (OR-combined with existing role policies)

-- Contracts & related
CREATE POLICY "contracts_perm_write" ON public.contracts FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit') OR has_permission(auth.uid(),'contracts.create') OR has_permission(auth.uid(),'contracts.delete'))
  WITH CHECK (has_permission(auth.uid(),'contracts.edit') OR has_permission(auth.uid(),'contracts.create'));

CREATE POLICY "contract_attachments_perm" ON public.contract_attachments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit')) WITH CHECK (has_permission(auth.uid(),'contracts.edit'));
CREATE POLICY "contract_delegates_perm" ON public.contract_delegates FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit')) WITH CHECK (has_permission(auth.uid(),'contracts.edit'));
CREATE POLICY "contract_deposit_deductions_perm" ON public.contract_deposit_deductions FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit')) WITH CHECK (has_permission(auth.uid(),'contracts.edit'));
CREATE POLICY "contract_offices_perm" ON public.contract_offices FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit')) WITH CHECK (has_permission(auth.uid(),'contracts.edit'));
CREATE POLICY "contract_parking_spots_perm" ON public.contract_parking_spots FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit')) WITH CHECK (has_permission(auth.uid(),'contracts.edit'));
CREATE POLICY "contract_payment_schedule_perm" ON public.contract_payment_schedule FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit')) WITH CHECK (has_permission(auth.uid(),'contracts.edit'));

-- Offices
CREATE POLICY "offices_perm_write" ON public.offices FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'offices.edit') OR has_permission(auth.uid(),'offices.create') OR has_permission(auth.uid(),'offices.delete') OR has_permission(auth.uid(),'offices.change_status'))
  WITH CHECK (has_permission(auth.uid(),'offices.edit') OR has_permission(auth.uid(),'offices.create') OR has_permission(auth.uid(),'offices.change_status'));
CREATE POLICY "office_files_perm" ON public.office_files FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'offices.edit')) WITH CHECK (has_permission(auth.uid(),'offices.edit'));

-- Tenants / Companies
CREATE POLICY "companies_perm_write" ON public.companies FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'tenants.edit') OR has_permission(auth.uid(),'tenants.create') OR has_permission(auth.uid(),'tenants.delete'))
  WITH CHECK (has_permission(auth.uid(),'tenants.edit') OR has_permission(auth.uid(),'tenants.create'));
CREATE POLICY "company_attachments_perm" ON public.company_attachments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'tenants.edit')) WITH CHECK (has_permission(auth.uid(),'tenants.edit'));
CREATE POLICY "contact_persons_perm" ON public.contact_persons FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'tenants.edit')) WITH CHECK (has_permission(auth.uid(),'tenants.edit'));
CREATE POLICY "client_interactions_perm" ON public.client_interactions FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'tenants.edit') OR has_permission(auth.uid(),'tenants.create'))
  WITH CHECK (has_permission(auth.uid(),'tenants.edit') OR has_permission(auth.uid(),'tenants.create'));
CREATE POLICY "client_unit_views_perm" ON public.client_unit_views FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'tenants.edit') OR has_permission(auth.uid(),'tenants.create'))
  WITH CHECK (has_permission(auth.uid(),'tenants.edit') OR has_permission(auth.uid(),'tenants.create'));

-- Finance
CREATE POLICY "invoices_perm_write" ON public.invoices FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'invoices.edit') OR has_permission(auth.uid(),'invoices.create') OR has_permission(auth.uid(),'invoices.delete'))
  WITH CHECK (has_permission(auth.uid(),'invoices.edit') OR has_permission(auth.uid(),'invoices.create'));
CREATE POLICY "payments_perm_write" ON public.payments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'payments.record') OR has_permission(auth.uid(),'payments.delete'))
  WITH CHECK (has_permission(auth.uid(),'payments.record'));

-- Expenses
CREATE POLICY "expenses_perm_write" ON public.expenses FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'expenses.edit') OR has_permission(auth.uid(),'expenses.create') OR has_permission(auth.uid(),'expenses.delete') OR has_permission(auth.uid(),'expenses.approve') OR has_permission(auth.uid(),'expenses.reject') OR has_permission(auth.uid(),'expenses.pay'))
  WITH CHECK (has_permission(auth.uid(),'expenses.edit') OR has_permission(auth.uid(),'expenses.create') OR has_permission(auth.uid(),'expenses.approve') OR has_permission(auth.uid(),'expenses.reject') OR has_permission(auth.uid(),'expenses.pay'));
CREATE POLICY "expense_attachments_perm" ON public.expense_attachments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'expenses.edit') OR has_permission(auth.uid(),'expenses.create'))
  WITH CHECK (has_permission(auth.uid(),'expenses.edit') OR has_permission(auth.uid(),'expenses.create'));

-- Maintenance
CREATE POLICY "maintenance_requests_perm_write" ON public.maintenance_requests FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'maintenance.edit') OR has_permission(auth.uid(),'maintenance.create') OR has_permission(auth.uid(),'maintenance.delete') OR has_permission(auth.uid(),'maintenance.assign') OR has_permission(auth.uid(),'maintenance.close') OR has_permission(auth.uid(),'maintenance.reopen'))
  WITH CHECK (has_permission(auth.uid(),'maintenance.edit') OR has_permission(auth.uid(),'maintenance.create') OR has_permission(auth.uid(),'maintenance.assign') OR has_permission(auth.uid(),'maintenance.close') OR has_permission(auth.uid(),'maintenance.reopen'));
CREATE POLICY "mra_perm" ON public.maintenance_request_attachments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'maintenance.edit') OR has_permission(auth.uid(),'maintenance.create'))
  WITH CHECK (has_permission(auth.uid(),'maintenance.edit') OR has_permission(auth.uid(),'maintenance.create'));

-- Assets & related
CREATE POLICY "asset_attachments_perm" ON public.asset_attachments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'assets.edit') OR has_permission(auth.uid(),'assets.create'))
  WITH CHECK (has_permission(auth.uid(),'assets.edit') OR has_permission(auth.uid(),'assets.create'));
CREATE POLICY "electricity_meters_perm" ON public.electricity_meters FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'assets.edit') OR has_permission(auth.uid(),'assets.create'))
  WITH CHECK (has_permission(auth.uid(),'assets.edit') OR has_permission(auth.uid(),'assets.create'));
CREATE POLICY "electricity_readings_perm" ON public.electricity_readings FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'assets.edit') OR has_permission(auth.uid(),'assets.create'))
  WITH CHECK (has_permission(auth.uid(),'assets.edit') OR has_permission(auth.uid(),'assets.create'));
CREATE POLICY "network_points_perm_write" ON public.network_points FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'assets.edit') OR has_permission(auth.uid(),'assets.create'))
  WITH CHECK (has_permission(auth.uid(),'assets.edit') OR has_permission(auth.uid(),'assets.create'));

-- Cleaning
CREATE POLICY "cleaning_contracts_perm" ON public.cleaning_contracts FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'cleaning.manage')) WITH CHECK (has_permission(auth.uid(),'cleaning.manage'));
CREATE POLICY "cleaning_contract_attachments_perm" ON public.cleaning_contract_attachments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'cleaning.manage')) WITH CHECK (has_permission(auth.uid(),'cleaning.manage'));
CREATE POLICY "cleaning_logs_perm" ON public.cleaning_logs FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'cleaning.manage')) WITH CHECK (has_permission(auth.uid(),'cleaning.manage'));

-- AC / Elevator / Fire / Supply contracts
CREATE POLICY "ac_contracts_perm" ON public.ac_contracts FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit') OR has_permission(auth.uid(),'contracts.create'))
  WITH CHECK (has_permission(auth.uid(),'contracts.edit') OR has_permission(auth.uid(),'contracts.create'));
CREATE POLICY "ac_contract_attachments_perm" ON public.ac_contract_attachments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit')) WITH CHECK (has_permission(auth.uid(),'contracts.edit'));
CREATE POLICY "ac_maintenance_logs_perm" ON public.ac_maintenance_logs FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'maintenance.edit') OR has_permission(auth.uid(),'maintenance.create'))
  WITH CHECK (has_permission(auth.uid(),'maintenance.edit') OR has_permission(auth.uid(),'maintenance.create'));
CREATE POLICY "elevator_contracts_perm" ON public.elevator_contracts FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit') OR has_permission(auth.uid(),'contracts.create'))
  WITH CHECK (has_permission(auth.uid(),'contracts.edit') OR has_permission(auth.uid(),'contracts.create'));
CREATE POLICY "elevator_contract_attachments_perm" ON public.elevator_contract_attachments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit')) WITH CHECK (has_permission(auth.uid(),'contracts.edit'));
CREATE POLICY "fire_contracts_perm" ON public.fire_contracts FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit') OR has_permission(auth.uid(),'contracts.create'))
  WITH CHECK (has_permission(auth.uid(),'contracts.edit') OR has_permission(auth.uid(),'contracts.create'));
CREATE POLICY "fire_contract_attachments_perm" ON public.fire_contract_attachments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'contracts.edit')) WITH CHECK (has_permission(auth.uid(),'contracts.edit'));

-- Cameras / camera maintenance
CREATE POLICY "camera_maintenance_logs_perm" ON public.camera_maintenance_logs FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'cameras.manage')) WITH CHECK (has_permission(auth.uid(),'cameras.manage'));

-- Guards & related
CREATE POLICY "guards_perm_write" ON public.guards FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'guards.edit') OR has_permission(auth.uid(),'guards.create') OR has_permission(auth.uid(),'guards.delete'))
  WITH CHECK (has_permission(auth.uid(),'guards.edit') OR has_permission(auth.uid(),'guards.create'));
CREATE POLICY "guard_attendance_perm" ON public.guard_attendance FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'guards.manage_attendance') OR has_permission(auth.uid(),'guards.edit'))
  WITH CHECK (has_permission(auth.uid(),'guards.manage_attendance') OR has_permission(auth.uid(),'guards.edit'));
CREATE POLICY "guard_evaluations_perm" ON public.guard_evaluations FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'guards.edit')) WITH CHECK (has_permission(auth.uid(),'guards.edit'));
CREATE POLICY "guard_leaves_perm" ON public.guard_leaves FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'guards.edit') OR has_permission(auth.uid(),'guards.manage_attendance'))
  WITH CHECK (has_permission(auth.uid(),'guards.edit') OR has_permission(auth.uid(),'guards.manage_attendance'));
CREATE POLICY "guard_pr_perm" ON public.guard_penalties_rewards FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'guards.edit')) WITH CHECK (has_permission(auth.uid(),'guards.edit'));
CREATE POLICY "guard_trainings_perm" ON public.guard_trainings FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'guards.edit')) WITH CHECK (has_permission(auth.uid(),'guards.edit'));

-- Patrols
CREATE POLICY "patrols_perm" ON public.patrols FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'patrols.create') OR has_permission(auth.uid(),'patrols.view'))
  WITH CHECK (has_permission(auth.uid(),'patrols.create'));
CREATE POLICY "patrol_checkpoints_perm" ON public.patrol_checkpoints FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'patrols.create')) WITH CHECK (has_permission(auth.uid(),'patrols.create'));

-- Employees
CREATE POLICY "employees_perm_write" ON public.employees FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'users.edit') OR has_permission(auth.uid(),'users.create') OR has_permission(auth.uid(),'users.delete'))
  WITH CHECK (has_permission(auth.uid(),'users.edit') OR has_permission(auth.uid(),'users.create'));
CREATE POLICY "employee_assignments_perm" ON public.employee_assignments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'users.edit') OR has_permission(auth.uid(),'users.assign_roles'))
  WITH CHECK (has_permission(auth.uid(),'users.edit') OR has_permission(auth.uid(),'users.assign_roles'));
CREATE POLICY "employee_departments_perm" ON public.employee_departments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'users.edit')) WITH CHECK (has_permission(auth.uid(),'users.edit'));
CREATE POLICY "employee_employers_perm" ON public.employee_employers FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'users.edit')) WITH CHECK (has_permission(auth.uid(),'users.edit'));

-- Documents
CREATE POLICY "documents_perm_write" ON public.documents FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'documents.edit') OR has_permission(auth.uid(),'documents.create') OR has_permission(auth.uid(),'documents.delete'))
  WITH CHECK (has_permission(auth.uid(),'documents.edit') OR has_permission(auth.uid(),'documents.create'));

-- Vendors
CREATE POLICY "vendors_perm_write" ON public.vendors FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'vendors.edit') OR has_permission(auth.uid(),'vendors.create') OR has_permission(auth.uid(),'vendors.delete'))
  WITH CHECK (has_permission(auth.uid(),'vendors.edit') OR has_permission(auth.uid(),'vendors.create'));

-- Tickets
CREATE POLICY "tickets_perm_write" ON public.tickets FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'tickets.edit') OR has_permission(auth.uid(),'tickets.create') OR has_permission(auth.uid(),'tickets.delete') OR has_permission(auth.uid(),'tickets.assign') OR has_permission(auth.uid(),'tickets.close'))
  WITH CHECK (has_permission(auth.uid(),'tickets.edit') OR has_permission(auth.uid(),'tickets.create') OR has_permission(auth.uid(),'tickets.assign') OR has_permission(auth.uid(),'tickets.close'));

-- Security incidents
CREATE POLICY "security_incidents_perm" ON public.security_incidents FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'incidents.edit') OR has_permission(auth.uid(),'incidents.create') OR has_permission(auth.uid(),'incidents.close'))
  WITH CHECK (has_permission(auth.uid(),'incidents.edit') OR has_permission(auth.uid(),'incidents.create') OR has_permission(auth.uid(),'incidents.close'));

-- Visitors
CREATE POLICY "visitors_perm_write" ON public.visitors FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'visitors.checkin') OR has_permission(auth.uid(),'visitors.checkout') OR has_permission(auth.uid(),'visitors.delete'))
  WITH CHECK (has_permission(auth.uid(),'visitors.checkin') OR has_permission(auth.uid(),'visitors.checkout'));

-- Parking related
CREATE POLICY "parking_maintenance_checks_perm" ON public.parking_maintenance_checks FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'parking.manage')) WITH CHECK (has_permission(auth.uid(),'parking.manage'));
CREATE POLICY "parking_cleaning_logs_perm" ON public.parking_cleaning_logs FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'parking.manage')) WITH CHECK (has_permission(auth.uid(),'parking.manage'));
CREATE POLICY "parking_violations_perm" ON public.parking_violations FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'parking.violations') OR has_permission(auth.uid(),'parking.manage'))
  WITH CHECK (has_permission(auth.uid(),'parking.violations') OR has_permission(auth.uid(),'parking.manage'));

-- Building identity
CREATE POLICY "building_identity_perm_update" ON public.building_identity FOR UPDATE TO authenticated
  USING (has_permission(auth.uid(),'identity.manage')) WITH CHECK (has_permission(auth.uid(),'identity.manage'));

-- App roles / permissions (roles.manage)
CREATE POLICY "app_roles_perm" ON public.app_roles FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'roles.manage')) WITH CHECK (has_permission(auth.uid(),'roles.manage'));
CREATE POLICY "role_permissions_perm" ON public.role_permissions FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'roles.manage')) WITH CHECK (has_permission(auth.uid(),'roles.manage'));
CREATE POLICY "user_role_assignments_perm" ON public.user_role_assignments FOR ALL TO authenticated
  USING (has_permission(auth.uid(),'users.assign_roles')) WITH CHECK (has_permission(auth.uid(),'users.assign_roles'));
