
CREATE TABLE public.expense_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_expense_attachments_expense ON public.expense_attachments(expense_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expense_attachments TO authenticated;
GRANT ALL ON public.expense_attachments TO service_role;

ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View expense attachments (finance)" ON public.expense_attachments
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'maintenance_supervisor'));

CREATE POLICY "Insert expense attachments" ON public.expense_attachments
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant') OR has_role(auth.uid(),'maintenance_supervisor'));

CREATE POLICY "Delete expense attachments (admin/accountant)" ON public.expense_attachments
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant'));

CREATE TRIGGER trg_expense_attachments_updated BEFORE UPDATE ON public.expense_attachments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for expense-attachments bucket
CREATE POLICY "expense-attachments read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'expense-attachments' AND (
    has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'maintenance_supervisor')
  ));

CREATE POLICY "expense-attachments insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'expense-attachments' AND (
    has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant') OR has_role(auth.uid(),'maintenance_supervisor')
  ));

CREATE POLICY "expense-attachments delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'expense-attachments' AND (
    has_role(auth.uid(),'super_admin') OR has_role(auth.uid(),'accountant')
  ));
