
REVOKE EXECUTE ON FUNCTION public.set_invoice_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_receipt_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalc_invoice_status(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.payments_recalc_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.invoices_recalc_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_overdue_invoices() FROM PUBLIC, anon, authenticated;
