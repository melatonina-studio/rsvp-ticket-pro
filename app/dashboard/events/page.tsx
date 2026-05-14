export const dynamic = "force-dynamic";

import Link from "next/link";
import EventsTable from "@/components/dashboard/events/events-table";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_ID } from "@/lib/org";

type SearchParams = Promise<{
  status?: string;
}>;

type EventRow = {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  starts_at: string | null;
  price_cents: number;
  capacity: number | null;
  status: string;
  access_mode: string;
  organization_id: string | null;
};

function isPast(startsAt: string | null, now: Date) {
  if (!startsAt) return false;
  return new Date(startsAt).getTime() < now.getTime();
}

function filterStatus(status: string, activeStatus: string) {
  if (activeStatus === "all") return true;
  return status === activeStatus;
}

function tabClass(active: boolean) {
  return active
    ? "rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-black"
    : "rounded-full border border-white/15 px-3 py-1.5 text-sm font-semibold text-neutral-300 transition hover:bg-white/10 hover:text-white";
}

function buildHref(status: string) {
  const params = new URLSearchParams();

  if (status !== "all") params.set("status", status);

  const query = params.toString();
  return query ? `/dashboard/events?${query}` : "/dashboard/events";
}

function statCard(label: string, value: number, tone?: string) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
        {label}
      </div>
      <div className={`mt-2 text-3xl font-bold ${tone ?? "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  count,
}: {
  title: string;
  subtitle: string;
  count: number;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
      </div>

      <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-sm text-neutral-400">
        {count} eventi
      </div>
    </div>
  );
}

export default async function EventsDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = createSupabaseServerClient();

  const activeStatus = params.status ?? "all";

  const [{ data: organization }, { data: events, error }] = await Promise.all([
    supabase
      .from("organization_settings")
      .select("id, name, slug, logo_url, primary_color")
      .eq("id", ACTIVE_ORG_ID)
      .single(),

    supabase
      .from("events")
      .select(
        "id,title,slug,location,starts_at,price_cents,capacity,status,access_mode,organization_id"
      )
      .eq("organization_id", ACTIVE_ORG_ID)
      .order("starts_at", { ascending: false }),
  ]);

  if (error) {
    throw new Error(error.message);
  }

  const now = new Date();

  const allEvents = ((events ?? []) as EventRow[]).filter((event) =>
    filterStatus(event.status, activeStatus)
  );

  const futureEvents = allEvents
    .filter((event) => !isPast(event.starts_at, now))
    .sort((a, b) => {
      const aTime = a.starts_at ? new Date(a.starts_at).getTime() : Infinity;
      const bTime = b.starts_at ? new Date(b.starts_at).getTime() : Infinity;
      return aTime - bTime;
    });

  const pastEvents = allEvents
    .filter((event) => isPast(event.starts_at, now))
    .sort((a, b) => {
      const aTime = a.starts_at ? new Date(a.starts_at).getTime() : 0;
      const bTime = b.starts_at ? new Date(b.starts_at).getTime() : 0;
      return bTime - aTime;
    });

  const publishedCount = ((events ?? []) as EventRow[]).filter(
    (event) => event.status === "published"
  ).length;

  const draftCount = ((events ?? []) as EventRow[]).filter(
    (event) => event.status === "draft"
  ).length;

  return (
    <main className="space-y-6 bg-black p-6 text-white">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="text-xs uppercase tracking-[0.18em] text-neutral-500">
          Organizzazione attiva
        </div>

        <div className="mt-2 text-2xl font-semibold">
          {organization?.name ?? "Organizzazione non trovata"}
        </div>

        <div className="mt-1 text-sm text-neutral-500">
          @{organization?.slug ?? "slug-non-disponibile"}
        </div>
      </section>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Eventi</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Gestisci eventi, pubblicazione, lista partecipanti e scanner.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/events/new"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Crea evento
          </Link>

          <Link
            href="/dashboard/participants"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Tutti i partecipanti
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        {statCard("Totale eventi", (events ?? []).length)}
        {statCard("In programma", futureEvents.length, "text-emerald-200")}
        {statCard("Archivio", pastEvents.length, "text-neutral-300")}
        {statCard("Draft", draftCount, "text-amber-200")}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Filtri</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Filtra gli eventi per stato di pubblicazione.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={buildHref("all")}
              className={tabClass(activeStatus === "all")}
            >
              Tutti
            </Link>

            <Link
              href={buildHref("published")}
              className={tabClass(activeStatus === "published")}
            >
              Pubblicati
            </Link>

            <Link
              href={buildHref("draft")}
              className={tabClass(activeStatus === "draft")}
            >
              Draft
            </Link>
          </div>
        </div>

        <p className="mt-4 text-xs text-neutral-500">
          Eventi filtrati: <strong>{allEvents.length}</strong> · Pubblicati:{" "}
          <strong>{publishedCount}</strong> · Draft:{" "}
          <strong>{draftCount}</strong>
        </p>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Eventi in programma"
          subtitle="Eventi futuri o ancora gestibili."
          count={futureEvents.length}
        />

        <EventsTable events={futureEvents} />
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Archivio eventi"
          subtitle="Eventi conclusi, utili per lista, report ed export."
          count={pastEvents.length}
        />

        <EventsTable events={pastEvents} />
      </section>
    </main>
  );
}