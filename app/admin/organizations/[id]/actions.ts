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