import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/PublicHeader";

type Props = {
  params: Promise<{ slug: string }>;
};

type EventCard = {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  starts_at: string | null;
  poster_url: string | null;
  access_mode: string | null;
};

function isPast(startsAt: string | null, now: Date) {
  if (!startsAt) return false;
  return new Date(startsAt).getTime() < now.getTime();
}

function formatDate(value: string | null) {
  if (!value) return "Data da definire";

  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function accessLabel(mode: string | null) {
  if (mode === "free") return "Gratuito";
  if (mode === "paid") return "Ticket online";
  if (mode === "door") return "Paga all’ingresso";
  return "Accesso";
}

function EventGrid({
  title,
  events,
}: {
  title: string;
  events: EventCard[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {events.length} eventi
          </p>
        </div>
      </div>

      {events.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/eventi/${event.slug}`}
              className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition hover:bg-white/[0.06]"
            >
              <div
                className="aspect-[3/4] bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
                style={{
                  backgroundImage: `url('${event.poster_url || "/cover-planet.jpg"}')`,
                }}
              />

              <div className="p-4">
                <div className="mb-3 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-300">
                  {accessLabel(event.access_mode)}
                </div>

                <h3 className="text-xl font-bold leading-tight text-white">
                  {event.title}
                </h3>

                <p className="mt-2 text-sm text-neutral-500">
                  {event.location || "Location da definire"}
                </p>

                <p className="mt-1 text-sm text-neutral-500">
                  {formatDate(event.starts_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-neutral-500">
          Nessun evento da mostrare.
        </div>
      )}
    </section>
  );
}

export default async function OrganizationPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createSupabaseServerClient();

  const { data: organization, error: organizationError } = await supabase
    .from("organization_settings")
    .select("id, name, slug, description, logo_url, primary_color, created_at")
    .eq("slug", slug)
    .single();

  if (organizationError || !organization) {
    notFound();
  }

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id,title,slug,location,starts_at,poster_url,access_mode,status,organization_id")
    .eq("organization_id", organization.id)
    .eq("status", "published")
    .order("starts_at", { ascending: false });

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  const now = new Date();
  const safeEvents = (events ?? []) as EventCard[];

  const upcomingEvents = safeEvents
    .filter((event) => !isPast(event.starts_at, now))
    .sort((a, b) => {
      const aTime = a.starts_at ? new Date(a.starts_at).getTime() : Infinity;
      const bTime = b.starts_at ? new Date(b.starts_at).getTime() : Infinity;
      return aTime - bTime;
    });

  const pastEvents = safeEvents
    .filter((event) => isPast(event.starts_at, now))
    .sort((a, b) => {
      const aTime = a.starts_at ? new Date(a.starts_at).getTime() : 0;
      const bTime = b.starts_at ? new Date(b.starts_at).getTime() : 0;
      return bTime - aTime;
    });

  return (
    <>
      <SiteHeader />

      <main className="min-h-screen bg-black px-5 pb-16 pt-28 text-white md:px-8 lg:px-10">
        <section className="mx-auto max-w-7xl">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 md:p-10">
            <div className="flex flex-wrap items-start justify-between gap-8">
              <div className="max-w-3xl">
                <div
                  className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em]"
                  style={{
                    color:
                      organization.primary_color || "rgba(255,255,255,0.62)",
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      background:
                        organization.primary_color || "rgba(255,255,255,0.5)",
                    }}
                  />
                  Organizzazione
                </div>

                <h1 className="text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
                  {organization.name}
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-400">
                  {organization.description ||
                    "Descrizione organizzazione non ancora disponibile."}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-neutral-400">
                @{organization.slug}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-10 max-w-7xl space-y-12">
          <EventGrid title="Eventi in programma" events={upcomingEvents} />
          <EventGrid title="Archivio eventi" events={pastEvents} />
        </section>
      </main>
    </>
  );
}