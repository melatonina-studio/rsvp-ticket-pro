import Link from "next/link";
import { redirect } from "next/navigation";
import { createOrganizationAction } from "./actions";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function errorMessage(error?: string) {
  if (error === "missing_name") return "Inserisci il nome dell’organizzazione.";
  if (error === "missing_slug") return "Slug non valido.";
  if (error === "slug_exists") return "Questo slug è già usato.";
  if (error === "create_failed") return "Errore durante la creazione.";
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
}

function fieldClass() {
  return "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30";
}

function selectClass() {
  return "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-white/30";
}

export default async function NewOrganizationPage({ searchParams }: Props) {
  await requireSuperAdmin();

  const params = await searchParams;
  const message = errorMessage(params.error);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/organizations"
              className="text-sm font-semibold text-neutral-400 transition hover:text-white"
            >
              ← Torna alle organizzazioni
            </Link>

            <h1 className="mt-4 text-3xl font-bold">Crea organizzazione</h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">
              Crea una nuova crew, cliente o organizzazione che potrà avere una
              pagina pubblica, eventi, ticket e dashboard dedicata.
            </p>
          </div>
        </div>

        {message ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {message}
          </div>
        ) : null}

        <form
          action={createOrganizationAction}
          className="space-y-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6"
        >
          <section className="space-y-5">
            <div>
              <h2 className="text-xl font-bold">Identità</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Nome, slug pubblico e descrizione della pagina organizzazione.
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
                  className={fieldClass()}
                  placeholder="Simbiosi Sonore"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Slug
                </label>
                <input
                  name="slug"
                  className={fieldClass()}
                  placeholder="simbiosi-sonore"
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Usato per /org/slug. Se vuoto viene generato dal nome.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Descrizione
              </label>
              <textarea
                name="description"
                className={`${fieldClass()} min-h-[150px] resize-y`}
                placeholder="Descrizione pubblica della crew..."
              />
            </div>
          </section>

          <section className="space-y-5 border-t border-white/10 pt-6">
            <div>
              <h2 className="text-xl font-bold">Brand</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Logo, colore principale e email di supporto.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Logo URL
                </label>
                <input
                  name="logo_url"
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
                  defaultValue="#ffffff"
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
                  className={fieldClass()}
                  placeholder="supporto@organizzazione.it"
                />
              </div>
            </div>
          </section>

          <section className="space-y-5 border-t border-white/10 pt-6">
            <div>
              <h2 className="text-xl font-bold">Piano e stato</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Per ora il piano è solo informativo. I blocchi funzionali li
                aggiungeremo dopo.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Piano
                </label>
                <select name="plan" defaultValue="free" className={selectClass()}>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="full">Full</option>
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black px-4 py-3">
                <input
                  type="checkbox"
                  name="is_public"
                  defaultChecked
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
                  defaultChecked
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
              Crea organizzazione
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}