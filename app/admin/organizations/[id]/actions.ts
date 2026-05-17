"use server";

import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function requireSuperAdmin() {
  const authSupabase = await createSupabaseAuthServerClient();
  const serviceSupabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: adminUser } = await serviceSupabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminUser) {
    redirect("/dashboard/events");
  }

  return { serviceSupabase };
}

export async function updateOrganizationAction(
  organizationId: string,
  formData: FormData
) {
  const { serviceSupabase } = await requireSuperAdmin();

  const name = String(formData.get("name") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const logoUrl = String(formData.get("logo_url") || "").trim();
  const primaryColor = String(formData.get("primary_color") || "").trim();
  const supportEmail = String(formData.get("support_email") || "").trim();
  const plan = String(formData.get("plan") || "free").trim();
  const isPublic = formData.get("is_public") === "on";
  const isActive = formData.get("is_active") === "on";

  if (!name) {
    redirect(`/admin/organizations/${organizationId}?error=missing_name`);
  }

  const slug = slugify(rawSlug || name);

  if (!slug) {
    redirect(`/admin/organizations/${organizationId}?error=missing_slug`);
  }

  const { data: existingOrg } = await serviceSupabase
    .from("organization_settings")
    .select("id")
    .eq("slug", slug)
    .neq("id", organizationId)
    .maybeSingle();

  if (existingOrg) {
    redirect(`/admin/organizations/${organizationId}?error=slug_exists`);
  }

  const { error } = await serviceSupabase
    .from("organization_settings")
    .update({
      name,
      slug,
      description: description || null,
      logo_url: logoUrl || null,
      primary_color: primaryColor || "#ffffff",
      support_email: supportEmail || null,
      plan: plan || "free",
      is_public: isPublic,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", organizationId);

  if (error) {
    console.error("UPDATE ORGANIZATION ERROR:", error);
    redirect(`/admin/organizations/${organizationId}?error=update_failed`);
  }

  redirect(`/admin/organizations/${organizationId}?saved=1`);
}

async function findAuthUserByEmail(email: string) {
  const serviceSupabase = createSupabaseServerClient();

  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await serviceSupabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    console.error("LIST AUTH USERS ERROR:", error);
    return null;
  }

  return (
    data.users.find((user) => user.email?.toLowerCase() === normalizedEmail) ??
    null
  );
}

export async function addOrganizationMemberAction(
  organizationId: string,
  formData: FormData
) {
  const { serviceSupabase } = await requireSuperAdmin();

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const role = String(formData.get("role") || "admin").trim();

  if (!email) {
    redirect(`/admin/organizations/${organizationId}?member_error=missing_email`);
  }

  const allowedRoles = ["owner", "admin", "scanner"];

  if (!allowedRoles.includes(role)) {
    redirect(`/admin/organizations/${organizationId}?member_error=invalid_role`);
  }

  const authUser = await findAuthUserByEmail(email);

  if (!authUser) {
    redirect(`/admin/organizations/${organizationId}?member_error=user_not_found`);
  }

  const { error } = await serviceSupabase
    .from("organization_members")
    .insert({
      organization_id: organizationId,
      user_id: authUser.id,
      role,
    });

  if (error) {
    if (error.code === "23505") {
      redirect(`/admin/organizations/${organizationId}?member_error=already_member`);
    }

    console.error("ADD ORGANIZATION MEMBER ERROR:", error);
    redirect(`/admin/organizations/${organizationId}?member_error=add_failed`);
  }

  redirect(`/admin/organizations/${organizationId}?member_saved=1`);
}

export async function removeOrganizationMemberAction(
  organizationId: string,
  formData: FormData
) {
  const { serviceSupabase } = await requireSuperAdmin();

  const memberId = String(formData.get("member_id") || "").trim();

  if (!memberId) {
    redirect(`/admin/organizations/${organizationId}?member_error=missing_member`);
  }

  const { error } = await serviceSupabase
    .from("organization_members")
    .delete()
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  if (error) {
    console.error("REMOVE ORGANIZATION MEMBER ERROR:", error);
    redirect(`/admin/organizations/${organizationId}?member_error=remove_failed`);
  }

  redirect(`/admin/organizations/${organizationId}?member_removed=1`);
}