export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateOrganizationAction } from "./actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
};

function errorMessage(error?: string) {
  if (error === "missing_name") return "Inserisci il nome dell’organizzazione.";
  if (error === "missing_slug") return "Slug non valido.";
  if (error === "slug_exists") return "Questo slug è già usato.";
  if (error === "update_failed") return "Errore durante il salvataggio.";
  return "";
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

function fieldClass() {
  return "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30";
}

function selectClass() {
  return "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-white/30";
}

function statCard(label: string, value: number | string) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div className="mt-2 text-3xl font-bold text-white">{value}</div>
    </div>
  );
}

export default async function OrganizationDetailPage({
  params,
  searchParams,
}: Props) {
  const { id } = await params;
  const query = await searchParams;

  const { serviceSupabase } = await requireSuperAdmin();

  const [
    { data: organization, error: organizationError },
    { data: events },
    { data: members },
  ] = await Promise.all([
    serviceSupabase
      .from("organization_settings")
      .select(
        "id,name,slug,description,logo_url,primary_color,support_email,plan,is_public,is_active,created_at,updated_at"
      )
      .eq("id", id)
      .single(),

    serviceSupabase
      .from("events")
      .select("id,status,starts_at")
      .eq("organization_id", id),

    serviceSupabase
      .from("organization_members")
      .select("id,role,user_id")
      .eq("organization_id", id),
  ]);

  if (organizationError || !organization) {
    notFound();
  }

  const eventCount = events?.length ?? 0;
  const publishedCount =
    events?.filter((event) => event.status === "published").length ?? 0;
  const memberCount = members?.length ?? 0;

  const message = errorMessage(query.error);
  const saved = query.saved === "1";

  const updateAction = updateOrganizationAction.bind(null, organization.id);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/organizations"
              className="text-sm font-semibold text-neutral-400 transition hover:text-white"
            >
              ← Torna alle organizzazioni
            </Link>

            <h1 className="mt-4 text-3xl font-bold">
              Gestisci organizzazione
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              Modifica identità, pagina pubblica, stato e piano
              dell’organizzazione.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {organization.slug ? (
              <Link
                href={`/org/${organization.slug}`}
                target="_blank"
                className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Apri pagina pubblica
              </Link>
            ) : null}

            <Link
              href="/admin/organizations"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Annulla
            </Link>
          </div>
        </div>

        {message ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {message}
          </div>
        ) : null}

        {saved ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            Organizzazione aggiornata correttamente.
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          {statCard("Eventi", eventCount)}
          {statCard("Pubblicati", publishedCount)}
          {statCard("Membri", memberCount)}
        </section>

        <form
          action={updateAction}
          className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >
          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">Identità</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Queste informazioni alimentano la pagina pubblica
                dell’organizzazione.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_320px]">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Nome organizzazione
                </label>
                <input
                  name="name"
                  required
                  defaultValue={organization.name ?? ""}
                  className={fieldClass()}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Slug
                </label>
                <input
                  name="slug"
                  defaultValue={organization.slug ?? ""}
                  className={fieldClass()}
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Pagina pubblica: /org/{organization.slug || "slug"}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Descrizione
              </label>
              <textarea
                name="description"
                defaultValue={organization.description ?? ""}
                className={`${fieldClass()} min-h-[160px] resize-y`}
              />
            </div>
          </section>

          <section className="space-y-5 border-t border-white/10 pt-6">
            <div>
              <h2 className="text-xl font-bold">Brand</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Logo, colore e contatti pubblici.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Logo URL
                </label>
                <input
                  name="logo_url"
                  defaultValue={organization.logo_url ?? ""}
                  className={fieldClass()}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Colore principale
                </label>
                <input
                  name="primary_color"
                  type="color"
                  defaultValue={organization.primary_color ?? "#ffffff"}
                  className="h-[50px] w-full rounded-xl border border-white/10 bg-black px-2 py-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Email supporto
                </label>
                <input
                  name="support_email"
                  type="email"
                  defaultValue={organization.support_email ?? ""}
                  className={fieldClass()}
                  placeholder="supporto@organizzazione.it"
                />
              </div>
            </div>

            {organization.logo_url ? (
              <div className="rounded-2xl border border-white/10 bg-black p-4">
                <div className="mb-3 text-xs uppercase tracking-[0.16em] text-neutral-500">
                  Anteprima logo
                </div>
                <img
                  src={organization.logo_url}
                  alt={organization.name ?? "Logo organizzazione"}
                  className="max-h-24 max-w-xs object-contain"
                />
              </div>
            ) : null}
          </section>

          <section className="space-y-5 border-t border-white/10 pt-6">
            <div>
              <h2 className="text-xl font-bold">Piano e stato</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Per ora il piano è informativo. I blocchi feature li
                collegheremo dopo.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Piano
                </label>
                <select
                  name="plan"
                  defaultValue={organization.plan ?? "free"}
                  className={selectClass()}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="full">Full</option>
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3">
                <input
                  type="checkbox"
                  name="is_public"
                  defaultChecked={organization.is_public !== false}
                  className="h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-semibold">Pubblica</span>
                  <span className="block text-xs text-neutral-500">
                    Visibile nel portale.
                  </span>
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={organization.is_active !== false}
                  className="h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-semibold">Attiva</span>
                  <span className="block text-xs text-neutral-500">
                    Può essere gestita.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 pt-6">
            <Link
              href="/admin/organizations"
              className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Annulla
            </Link>

            <button
              type="submit"
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              Salva modifiche
            </button>
          </div>
        </form>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-xl font-bold">Accessi organizzazione</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Qui aggiungeremo gli utenti che possono gestire questa
            organizzazione.
          </p>

          <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-6 text-sm text-neutral-500">
            Prossimo step: aggiunta membri tramite email utente Supabase Auth.
          </div>
        </section>
      </div>
    </main>
  );
}