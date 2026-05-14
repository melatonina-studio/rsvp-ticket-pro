export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/login/actions";

type Organization = {
  id: string;
  name: string | null;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  primary_color: string | null;
  support_email: string | null;
  plan: string | null;
  is_public: boolean | null;
  is_active?: boolean | null;
  created_at: string | null;
};

type EventRow = {
  organization_id: string | null;
};

type MemberRow = {
  organization_id: string | null;
};

function badge(label: string, tone: "green" | "amber" | "neutral" | "violet") {
  const classes =
    tone === "green"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : tone === "amber"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
        : tone === "violet"
          ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
          : "border-neutral-500/30 bg-neutral-500/10 text-neutral-300";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function countByOrganization(rows: { organization_id: string | null }[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    if (!row.organization_id) return acc;
    acc[row.organization_id] = (acc[row.organization_id] ?? 0) + 1;
    return acc;
  }, {});
}

export default async function AdminOrganizationsPage() {
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
    .select("id,user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminUser) {
    redirect("/dashboard/events");
  }

  const [
    { data: organizations, error: organizationsError },
    { data: events, error: eventsError },
    { data: members, error: membersError },
  ] = await Promise.all([
    serviceSupabase
      .from("organization_settings")
      .select(
        "id,name,slug,description,logo_url,primary_color,support_email,plan,is_public,is_active,created_at"
      )
      .order("created_at", { ascending: false }),

    serviceSupabase
      .from("events")
      .select("organization_id"),

    serviceSupabase
      .from("organization_members")
      .select("organization_id"),
  ]);

  if (organizationsError) {
    throw new Error(organizationsError.message);
  }

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  if (membersError) {
    throw new Error(membersError.message);
  }

  const safeOrganizations = (organizations ?? []) as Organization[];
  const eventCounts = countByOrganization((events ?? []) as EventRow[]);
  const memberCounts = countByOrganization((members ?? []) as MemberRow[]);

  const activeCount = safeOrganizations.filter(
    (org) => org.is_active !== false
  ).length;

  const publicCount = safeOrganizations.filter(
    (org) => org.is_public !== false
  ).length;

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Super Admin
          </div>

          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Organizzazioni</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Gestisci crew, clienti, pagine pubbliche e accessi alla piattaforma.
              </p>
            </div>
        
            <div className="flex flex-wrap gap-2">
            <Link
                href="/admin/organizations/new"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
                Crea organizzazione
            </Link>

            <form action={logoutAction}>
                <button
                type="submit"
                className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-400/20"
                >
                Logout
                </button>
            </form>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              Totale org
            </div>
            <div className="mt-2 text-3xl font-bold">{safeOrganizations.length}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              Attive
            </div>
            <div className="mt-2 text-3xl font-bold text-emerald-200">
              {activeCount}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              Pubbliche
            </div>
            <div className="mt-2 text-3xl font-bold text-sky-200">
              {publicCount}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              Eventi totali
            </div>
            <div className="mt-2 text-3xl font-bold text-violet-200">
              {(events ?? []).length}
            </div>
          </div>
        </section>

        {safeOrganizations.length ? (
          <section className="grid gap-4">
            {safeOrganizations.map((org) => {
              const orgEvents = eventCounts[org.id] ?? 0;
              const orgMembers = memberCounts[org.id] ?? 0;

              return (
                <article
                  key={org.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            background:
                              org.primary_color || "rgba(255,255,255,0.5)",
                          }}
                        />

                        <h2 className="text-2xl font-bold text-white">
                          {org.name || "Organizzazione senza nome"}
                        </h2>
                      </div>

                      <div className="mt-1 text-sm text-neutral-500">
                        @{org.slug || "slug-non-disponibile"} · creata il{" "}
                        {formatDate(org.created_at)}
                      </div>

                      {org.description ? (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-400">
                          {org.description}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm text-neutral-600">
                          Nessuna descrizione inserita.
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {badge(org.plan || "free", "violet")}
                        {org.is_public === false
                          ? badge("Non pubblica", "neutral")
                          : badge("Pubblica", "green")}
                        {org.is_active === false
                          ? badge("Disattiva", "amber")
                          : badge("Attiva", "green")}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {org.slug ? (
                        <Link
                          href={`/org/${org.slug}`}
                          target="_blank"
                          className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          Apri pagina
                        </Link>
                      ) : null}

                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
                      >
                        Gestisci
                      </Link>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                        Eventi
                      </div>
                      <div className="mt-1 text-xl font-bold text-white">
                        {orgEvents}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                        Membri
                      </div>
                      <div className="mt-1 text-xl font-bold text-white">
                        {orgMembers}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
                        Email supporto
                      </div>
                      <div className="mt-1 text-sm text-neutral-300">
                        {org.support_email || "Non impostata"}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
            <h2 className="text-2xl font-bold">Nessuna organizzazione</h2>
            <p className="mt-2 text-sm text-neutral-500">
              Crea la prima organizzazione per iniziare a usare la piattaforma.
            </p>

            <Link
              href="/admin/organizations/new"
              className="mt-5 inline-flex rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              Crea organizzazione
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}