import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/PublicHeader";
import HomeForm from "@/components/HomeForm";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

type OrganizationJoin =
  | {
      name: string | null;
      slug: string | null;
      logo_url: string | null;
      primary_color: string | null;
    }
  | Array<{
      name: string | null;
      slug: string | null;
      logo_url: string | null;
      primary_color: string | null;
    }>
  | null;

function getOrganization(event: { organization_settings: OrganizationJoin }) {
  if (Array.isArray(event.organization_settings)) {
    return event.organization_settings[0] ?? null;
  }

  return event.organization_settings ?? null;
}

function formatFullDate(value: string | null) {
  if (!value) return "Data da definire";

  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value: string | null) {
  if (!value) return "Data da definire";

  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPrice(priceCents: number | null, accessMode: string | null) {
  if (accessMode === "free") return "Gratuito";
  if (!priceCents || priceCents <= 0) return "Prezzo non indicato";
  return `€ ${(priceCents / 100).toFixed(2)}`;
}

function accessModeLabel(accessMode: string | null) {
  if (accessMode === "free") return "Gratuito";
  if (accessMode === "paid") return "Ticket online";
  if (accessMode === "door") return "Paga all’ingresso";
  return "Accesso";
}

function ticketCtaLabel(accessMode: string | null) {
  if (accessMode === "paid") return "Acquista ticket";
  if (accessMode === "door") return "Entra in lista";
  return "Registrati";
}

function splitLines(value: string | null) {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const supabase = createSupabaseServerClient();

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      id,
      organization_id,
      title,
      slug,
      description,
      location,
      location_maps_url,
      starts_at,
      ends_at,
      price_cents,
      capacity,
      status,
      access_mode,
      poster_url,
      lineup_text,
      playlist_1_url,
      playlist_2_url,
      organization_settings (
        name,
        slug,
        logo_url,
        primary_color
      )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !event) {
    notFound();
  }

  const organization = getOrganization(event);
  const now = new Date();

  const eventEndDate = event.ends_at
    ? new Date(event.ends_at)
    : event.starts_at
      ? new Date(event.starts_at)
      : null;

  const isPast = eventEndDate ? eventEndDate.getTime() < now.getTime() : false;

  const posterUrl = event.poster_url || "/cover-planet.jpg";
  const lineup = splitLines(event.lineup_text);
  const playlists = [event.playlist_1_url, event.playlist_2_url].filter(Boolean);

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black pb-24 text-white lg:pb-0">
        {/* HERO */}
        <section className="border-b border-white/10 px-5 pb-10 pt-24 md:px-8 lg:px-10 lg:pt-28">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">
            {/* MOBILE INTRO FIRST */}
            <div className="order-1 lg:order-2">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-200">
                  {accessModeLabel(event.access_mode)}
                </span>

                {isPast ? (
                  <span className="rounded-full border border-neutral-500/30 bg-neutral-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
                    Evento passato
                  </span>
                ) : (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200">
                    In programma
                  </span>
                )}
              </div>

              {organization?.name ? (
                <Link
                  href={`/org/${organization.slug}`}
                  className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] transition hover:opacity-70"
                  style={{
                    color: organization.primary_color || "rgba(255,255,255,0.62)",
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background:
                        organization.primary_color || "rgba(255,255,255,0.5)",
                    }}
                  />
                  {organization.name}
                </Link>
              ) : null}

              <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.92] tracking-tight md:text-7xl xl:text-8xl">
                {event.title}
              </h1>

              <div className="mt-7 grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 md:grid-cols-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                    Data
                  </div>
                  <div className="mt-1 text-base text-neutral-200">
                    {formatFullDate(event.starts_at)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                    Location
                  </div>
                  <div className="mt-1 text-base text-neutral-200">
                    {event.location || "Location da definire"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                    Accesso
                  </div>
                  <div className="mt-1 text-base text-neutral-200">
                    {formatPrice(event.price_cents, event.access_mode)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                    Capienza
                  </div>
                  <div className="mt-1 text-base text-neutral-200">
                    {event.capacity ? `${event.capacity} persone` : "Non indicata"}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {!isPast ? (
                  <a
                    href="#ticket-form"
                    className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
                  >
                    {ticketCtaLabel(event.access_mode)}
                  </a>
                ) : null}

                {event.location_maps_url ? (
                  <Link
                    href={event.location_maps_url}
                    target="_blank"
                    className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Apri posizione
                  </Link>
                ) : null}
              </div>
            </div>

            {/* POSTER */}
            <div className="order-2 lg:order-1">
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/50">
                <img
                  src={posterUrl}
                  alt={`Locandina ${event.title}`}
                  className="aspect-[3/4] w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="px-5 py-10 md:px-8 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_420px]">
            <div className="space-y-8">
              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
                <h2 className="text-2xl font-bold">Info evento</h2>

                {event.description ? (
                  <p className="mt-4 whitespace-pre-line text-base leading-7 text-neutral-300">
                    {event.description}
                  </p>
                ) : (
                  <p className="mt-4 text-neutral-500">
                    Nessuna descrizione disponibile.
                  </p>
                )}
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
                <h2 className="text-2xl font-bold">Lineup</h2>

                {lineup.length ? (
                  <div className="mt-5 grid gap-3">
                    {lineup.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-neutral-200"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-neutral-500">Lineup non disponibile.</p>
                )}
              </section>

              {playlists.length ? (
                <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
                  <h2 className="text-2xl font-bold">Playlist</h2>

                  <div className="mt-5 flex flex-wrap gap-3">
                    {playlists.map((playlist, index) => (
                      <Link
                        key={playlist}
                        href={playlist as string}
                        target="_blank"
                        className="rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Apri playlist {index + 1}
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}

              {isPast ? (
                <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
                  <h2 className="text-2xl font-bold">Archivio evento</h2>

                  <p className="mt-4 text-neutral-400">
                    Questo evento è concluso. Presto qui potremo mostrare foto,
                    contenuti caricati dai partecipanti e materiali della serata.
                  </p>

                  <div className="mt-5 rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-neutral-500">
                    Gallery evento in arrivo
                  </div>
                </section>
              ) : null}
            </div>

            {/* FORM / STATUS */}
            <aside id="ticket-form" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
              {!isPast ? (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/40">
                  <div className="mb-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                      Accesso evento
                    </div>

                    <h2 className="mt-2 text-2xl font-bold">
                      {ticketCtaLabel(event.access_mode)}
                    </h2>

                    <p className="mt-2 text-sm text-neutral-500">
                      Compila i dati per ricevere il tuo ticket digitale.
                    </p>
                  </div>

                  <HomeForm
                    event={{
                      id: event.id,
                      title: event.title,
                      slug: event.slug,
                      description: event.description,
                      location: event.location,
                      starts_at: event.starts_at,
                      price_cents: event.price_cents,
                      access_mode: event.access_mode,
                    }}
                    compact
                  />
                </div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    Stato evento
                  </div>

                  <h2 className="mt-2 text-2xl font-bold">Evento concluso</h2>

                  <p className="mt-3 text-sm leading-6 text-neutral-400">
                    Le registrazioni non sono più disponibili. Puoi consultare
                    le informazioni dell’evento e, in futuro, i contenuti
                    dell’archivio.
                  </p>

                  <Link
                    href="/"
                    className="mt-5 inline-flex rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
                  >
                    Torna agli eventi
                  </Link>
                </div>
              )}
            </aside>
          </div>
        </section>

        {/* MOBILE STICKY CTA */}
        {!isPast ? (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/90 px-4 py-3 backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-md items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">
                  {formatPrice(event.price_cents, event.access_mode)}
                </div>
                <div className="truncate text-xs text-neutral-500">
                  {formatShortDate(event.starts_at)}
                </div>
              </div>

              <a
                href="#ticket-form"
                className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black"
              >
                {ticketCtaLabel(event.access_mode)}
              </a>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
}