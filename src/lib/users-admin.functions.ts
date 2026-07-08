import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// الأدوار المدمجة في enum القديم — لأي دور خارجها بنكتب في user_role_assignments فقط
const BUILTIN_ROLES = new Set([
  "super_admin",
  "accountant",
  "security_supervisor",
  "maintenance_supervisor",
  "receptionist",
  "owner",
]);

async function syncUserRoles(supabaseAdmin: any, userId: string, roleNames: string[]) {
  // امسح كل الأدوار الحالية
  await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
  await supabaseAdmin.from("user_role_assignments").delete().eq("user_id", userId);
  if (!roleNames.length) return;

  // الأدوار المدمجة → user_roles (للتوافق مع has_role الـ enum)
  const builtin = roleNames.filter((n) => BUILTIN_ROLES.has(n));
  if (builtin.length) {
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert(builtin.map((role) => ({ user_id: userId, role })));
    if (error) throw new Error(error.message);
  }

  // كل الأدوار (مدمجة + مخصصة) → user_role_assignments
  const { data: roleRows, error: rErr } = await supabaseAdmin
    .from("app_roles")
    .select("id, name")
    .in("name", roleNames);
  if (rErr) throw new Error(rErr.message);
  const found = new Set((roleRows ?? []).map((r: any) => r.name));
  const missing = roleNames.filter((n) => !found.has(n));
  if (missing.length) {
    throw new Error(`أدوار غير موجودة في النظام: ${missing.join(", ")}`);
  }
  if (roleRows && roleRows.length) {
    const { error } = await supabaseAdmin.from("user_role_assignments").insert(
      roleRows.map((r: any) => ({ user_id: userId, role_id: r.id })),
    );
    if (error) throw new Error(error.message);
  }
}

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "super_admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("غير مصرّح: هذه العملية للمدير العام فقط");
}

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      email: z.string().trim().email(),
      password: z.string().min(8).max(72),
      full_name: z.string().trim().min(1).max(120),
      phone: z.string().trim().max(40).optional().or(z.literal("")),
      roles: z.array(z.string().trim().min(1)).default([]),
      is_active: z.boolean().default(true),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        phone: data.phone || null,
      },
    });
    if (error) throw new Error(error.message);
    const uid = created.user!.id;

    // Wait briefly for the handle_new_user trigger to create the profile, then upsert phone/active
    await supabaseAdmin
      .from("profiles")
      .upsert({
        id: uid,
        full_name: data.full_name,
        phone: data.phone || null,
        is_active: data.is_active,
      });

    // Replace roles (handle_new_user may have inserted super_admin for the first ever user)
    await supabaseAdmin.from("user_roles").delete().eq("user_id", uid);
    await supabaseAdmin.from("user_role_assignments").delete().eq("user_id", uid);
    if (data.roles.length) {
      const { error: e2 } = await supabaseAdmin
        .from("user_roles")
        .insert(data.roles.map((role) => ({ user_id: uid, role })));
      if (e2) throw new Error(e2.message);
      // Mirror to user_role_assignments (new system)
      const { data: roleRows } = await supabaseAdmin
        .from("app_roles")
        .select("id, name")
        .in("name", data.roles as any);
      if (roleRows && roleRows.length) {
        await supabaseAdmin.from("user_role_assignments").insert(
          roleRows.map((r: any) => ({ user_id: uid, role_id: r.id })),
        );
      }
    }
    return { id: uid };
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      user_id: z.string().uuid(),
      full_name: z.string().trim().min(1).max(120),
      phone: z.string().trim().max(40).optional().or(z.literal("")),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.full_name, phone: data.phone || null })
      .eq("id", data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const resetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      user_id: z.string().uuid(),
      password: z.string().min(8).max(72),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ user_id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId) {
      throw new Error("لا يمكنك حذف حسابك الخاص");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserRoles = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      user_id: z.string().uuid(),
      roles: z.array(z.enum(ROLES)),
    }),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    await supabaseAdmin.from("user_role_assignments").delete().eq("user_id", data.user_id);
    if (data.roles.length) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert(data.roles.map((role) => ({ user_id: data.user_id, role })));
      if (error) throw new Error(error.message);
      // Mirror to user_role_assignments (new system)
      const { data: roleRows } = await supabaseAdmin
        .from("app_roles")
        .select("id, name")
        .in("name", data.roles as any);
      if (roleRows && roleRows.length) {
        await supabaseAdmin.from("user_role_assignments").insert(
          roleRows.map((r: any) => ({ user_id: data.user_id, role_id: r.id })),
        );
      }
    }
    return { ok: true };
  });
