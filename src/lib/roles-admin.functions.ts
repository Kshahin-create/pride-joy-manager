import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "super_admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("غير مصرّح: هذه العملية للمدير العام فقط");
}

/* ===== قراءة عامة (متاحة لأي مستخدم مسجّل) ===== */
export const listRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("app_roles")
      .select("id, name, description, is_system, created_at")
      .order("is_system", { ascending: false })
      .order("name");
    if (error) throw new Error(error.message);

    // عدّ المستخدمين لكل دور
    const { data: counts } = await context.supabase
      .from("user_role_assignments")
      .select("role_id");
    const userCounts: Record<string, number> = {};
    ((counts ?? []) as any[]).forEach((r) => {
      userCounts[r.role_id] = (userCounts[r.role_id] ?? 0) + 1;
    });

    // عدّ صلاحيات كل دور
    const { data: perms } = await context.supabase
      .from("role_permissions")
      .select("role_id");
    const permCounts: Record<string, number> = {};
    ((perms ?? []) as any[]).forEach((r) => {
      permCounts[r.role_id] = (permCounts[r.role_id] ?? 0) + 1;
    });

    return (data ?? []).map((r: any) => ({
      ...r,
      user_count: userCounts[r.id] ?? 0,
      permission_count: permCounts[r.id] ?? 0,
    }));
  });

export const listPermissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("app_permissions")
      .select("*")
      .order("sort_order");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getRolePermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ role_id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("role_permissions")
      .select("permission_key")
      .eq("role_id", data.role_id);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => r.permission_key as string);
  });

/* ===== كتابة (للمدير العام فقط) ===== */
export const createRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      name: z.string().trim().min(2).max(60).regex(/^[a-zA-Z0-9_]+$/, "اسم تقني بالإنجليزية فقط (حروف وأرقام وشرطة سفلية)"),
      description: z.string().trim().max(200).optional().or(z.literal("")),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin
      .from("app_roles")
      .insert({
        name: data.name,
        description: data.description || null,
        is_system: false,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: created!.id };
  });

export const updateRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      role_id: z.string().uuid(),
      name: z.string().trim().min(2).max(60).regex(/^[a-zA-Z0-9_]+$/).optional(),
      description: z.string().trim().max(200).optional().or(z.literal("")),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cur } = await supabaseAdmin.from("app_roles").select("is_system, name").eq("id", data.role_id).maybeSingle();
    if (!cur) throw new Error("الدور غير موجود");
    if (cur.is_system && data.name && data.name !== cur.name) {
      throw new Error("لا يمكن تغيير اسم دور النظام");
    }
    const patch: any = {};
    if (data.name) patch.name = data.name;
    if (data.description !== undefined) patch.description = data.description || null;
    const { error } = await supabaseAdmin.from("app_roles").update(patch).eq("id", data.role_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ role_id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cur } = await supabaseAdmin.from("app_roles").select("is_system, name").eq("id", data.role_id).maybeSingle();
    if (!cur) throw new Error("الدور غير موجود");
    if (cur.is_system) throw new Error("لا يمكن حذف دور النظام");
    const { error } = await supabaseAdmin.from("app_roles").delete().eq("id", data.role_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setRolePermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      role_id: z.string().uuid(),
      permission_keys: z.array(z.string()),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cur } = await supabaseAdmin.from("app_roles").select("name").eq("id", data.role_id).maybeSingle();
    if (cur?.name === "super_admin") {
      throw new Error("لا يمكن تعديل صلاحيات المدير العام (يحصل على كل الصلاحيات تلقائيًا)");
    }
    await supabaseAdmin.from("role_permissions").delete().eq("role_id", data.role_id);
    if (data.permission_keys.length) {
      const rows = data.permission_keys.map((k) => ({ role_id: data.role_id, permission_key: k }));
      const { error } = await supabaseAdmin.from("role_permissions").insert(rows);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/* ===== ربط المستخدم بالأدوار (يحل محل setUserRoles القديم — يكتب في النظامين) ===== */
export const setUserRolesById = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      user_id: z.string().uuid(),
      role_ids: z.array(z.string().uuid()),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // اكتب في user_role_assignments
    await supabaseAdmin.from("user_role_assignments").delete().eq("user_id", data.user_id);
    if (data.role_ids.length) {
      const rows = data.role_ids.map((rid) => ({ user_id: data.user_id, role_id: rid, assigned_by: context.userId }));
      const { error } = await supabaseAdmin.from("user_role_assignments").insert(rows);
      if (error) throw new Error(error.message);
    }

    // مزامنة للنظام القديم (user_roles) لو الاسم من الـ enum
    const enumRoles = new Set(["super_admin","accountant","security_supervisor","maintenance_supervisor","receptionist","owner"]);
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    if (data.role_ids.length) {
      const { data: names } = await supabaseAdmin
        .from("app_roles")
        .select("name")
        .in("id", data.role_ids);
      const legacy = ((names ?? []) as any[])
        .map((n) => n.name)
        .filter((n) => enumRoles.has(n))
        .map((role) => ({ user_id: data.user_id, role }));
      if (legacy.length) {
        await supabaseAdmin.from("user_roles").insert(legacy);
      }
    }
    return { ok: true };
  });

export const getUserRoleAssignments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_role_assignments")
      .select("user_id, role_id, app_roles(name)");
    if (error) throw new Error(error.message);
    return data ?? [];
  });
