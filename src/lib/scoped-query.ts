/**
 * يضيف فلتر property_id على أي استعلام Supabase حسب العقار النشط.
 * مرّر "all" أو null لإلغاء الفلترة (المدير العام).
 */
export function scoped<T extends { eq: (col: string, val: any) => T }>(
  q: T,
  propertyId: string | null | undefined,
): T {
  if (propertyId && propertyId !== "all") {
    return q.eq("property_id", propertyId);
  }
  return q;
}
