export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  updateOrganizationAction,
  addOrganizationMemberAction,
  removeOrganizationMemberAction,
} from "./actions";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    saved?: string;
    member_error?: string;
    member_saved?: string;
    member_removed?: string;
  }>;
};

function errorMessage(error?: string) {
  if (error === "missing_name") return "Inserisci il nome dell’organizzazione.";
  if (error === "missing_slug") return "Slug non valido.";
  if (error === "slug_exists") return "Questo slug è già usato.";
  if (error === "update_failed") return "Errore durante il salvataggio.";
  return "";
}
function memberErrorMessage(error?: string) {
  if (error === "missing_email") return "Inserisci l’email dell’utente.";
  if (error === "invalid_role") return "Ruolo non valido.";
  if (error === "user_not_found")
    return "Utente non trovato. Prima crealo in Supabase Authentication.";
  if (error === "already_member")
    return "Questo utente è già membro dell’organizzazione.";
  if (error === "add_failed") return "Errore durante l’aggiunta del membro.";
  if (error === "missing_member") return "Membro non valido.";
  if (error === "remove_failed") return "Errore durante la rimozione.";
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
        .select("id,role,user_id,created_at")
        .eq("organization_id", id)
        .order("created_at", { ascending: false }),
  ]);

  if (organizationError || !organization) {
    notFound();
  }

  const eventCount = events?.length ?? 0;
  const publishedCount =
    events?.filter((event) => event.status === "published").length ?? 0;
  const memberCount = members?.length ?? 0;
  const { data: authUsersData } = await serviceSupabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
    });

    const authUsersById = new Map(
    (authUsersData?.users ?? []).map((user) => [user.id, user])
    );

    const safeMembers = members ?? [];

    const addMemberAction = addOrganizationMemberAction.bind(null, organization.id);
    const removeMemberAction = removeOrganizationMemberAction.bind(
    null,
    organization.id
    );

    const memberMessage = memberErrorMessage(query.member_error);
    const memberSaved = query.member_saved === "1";
    const memberRemoved = query.member_removed === "1";

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
        {memberMessage ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {memberMessage}
        </div>
        ) : null}

        {memberSaved ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            Membro aggiunto correttamente.
        </div>
        ) : null}

        {memberRemoved ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
            Membro rimosso correttamente.
        </div>
        ) : null}
        {memberMessage ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {memberMessage}
          </div>
        ) : null}

        {memberSaved ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-200">
            Membro aggiunto correttamente.
          </div>
        ) : null}

        {memberRemoved ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-200">
            Membro rimosso correttamente.
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Accessi organizzazione</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Collega utenti Supabase Auth a questa organizzazione.
              </p>
            </div>

            <div className="rounded-full border border-white/10 bg-black px-3 py-1 text-sm text-neutral-400">
              {safeMembers.length} membri
            </div>
          </div>

          <form
            action={addMemberAction}
            className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black p-4 md:grid-cols-[1fr_180px_auto]"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Email utente
              </label>
              <input
                name="email"
                type="email"
                required
                className={fieldClass()}
                placeholder="utente@email.com"
              />
              <p className="mt-2 text-xs text-neutral-500">
                L’utente deve già esistere in Supabase Authentication.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Ruolo</label>
              <select name="role" defaultValue="admin" className={selectClass()}>
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="scanner">Scanner</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
              >
                Aggiungi
              </button>
            </div>
          </form>

          <div className="mt-6">
            {safeMembers.length ? (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-white/10 bg-white/[0.04]">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                        Utente
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                        Ruolo
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                        Aggiunto
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-neutral-500">
                        Azioni
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {safeMembers.map((member: any) => {
                      const authUser = authUsersById.get(member.user_id);

                      return (
                        <tr
                          key={member.id}
                          className="border-b border-white/10 align-top"
                        >
                          <td className="px-4 py-4">
                            <div className="font-semibold text-white">
                              {authUser?.email || "Utente non trovato"}
                            </div>
                            <div className="mt-1 font-mono text-xs text-neutral-600">
                              {member.user_id}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full border border-violet-400/30 bg-violet-400/10 px-2.5 py-1 text-xs font-medium uppercase text-violet-200">
                              {member.role}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-neutral-400">
                            {member.created_at
                              ? new Intl.DateTimeFormat("it-IT", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                }).format(new Date(member.created_at))
                              : "—"}
                          </td>

                          <td className="px-4 py-4 text-right">
                            <form action={removeMemberAction}>
                              <input
                                type="hidden"
                                name="member_id"
                                value={member.id}
                              />

                              <button
                                type="submit"
                                className="rounded-xl border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-400/20"
                              >
                                Rimuovi
                              </button>
                            </form>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/15 p-6 text-sm text-neutral-500">
                Nessun membro collegato a questa organizzazione.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}