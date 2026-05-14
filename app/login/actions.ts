"use server";

import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!email || !password) {
    redirect("/login?error=missing");
  }

  const supabase = await createSupabaseAuthServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/login?error=invalid");
  }

  redirect("/admin/organizations");
}

export async function logoutAction() {
  const supabase = await createSupabaseAuthServerClient();
  await supabase.auth.signOut();

  redirect("/login");
}