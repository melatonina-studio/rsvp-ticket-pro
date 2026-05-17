import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_ID } from "@/lib/org";

export type ActiveOrganization = {
  id: string;
  name: string | null;
  slug: string | null;
  logo_url: string | null;
  primary_color: string | null;
  description?: string | null;
  plan?: string | null;
  is_public?: boolean | null;
  is_active?: boolean | null;
};

type OrganizationMemberJoin =
  | {
      role: string | null;
      organization_settings:
        | ActiveOrganization
        | ActiveOrganization[]
        | null;
    }
  | null;

function getJoinedOrganization(row: OrganizationMemberJoin) {
  if (!row?.organization_settings) return null;

  if (Array.isArray(row.organization_settings)) {
    return row.organization_settings[0] ?? null;
  }

  return row.organization_settings;
}

export async function getActiveOrganization() {
  const authSupabase = await createSupabaseAuthServerClient();
  const serviceSupabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await serviceSupabase
    .from("organization_members")
    .select(
      `
      role,
      organization_settings (
        id,
        name,
        slug,
        logo_url,
        primary_color,
        description,
        plan,
        is_public,
        is_active
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const organization = getJoinedOrganization(
    membership as OrganizationMemberJoin
  );

  if (organization) {
    return {
      user,
      organization,
      role: membership?.role ?? "admin",
      isSuperAdmin: false,
    };
  }

  // Fallback temporaneo: se sei super admin ma non sei ancora membro di nessuna org,
  // manteniamo Simbiosi come organizzazione attiva per non rompere la demo.
  const { data: adminUser } = await serviceSupabase
    .from("admin_users")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (adminUser) {
    const { data: fallbackOrg } = await serviceSupabase
      .from("organization_settings")
      .select(
        "id,name,slug,logo_url,primary_color,description,plan,is_public,is_active"
      )
      .eq("id", ACTIVE_ORG_ID)
      .single();

    if (fallbackOrg) {
      return {
        user,
        organization: fallbackOrg as ActiveOrganization,
        role: "super_admin",
        isSuperAdmin: true,
      };
    }

    redirect("/admin/organizations");
  }

  redirect("/login");
}