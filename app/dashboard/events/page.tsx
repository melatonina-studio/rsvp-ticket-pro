export const dynamic = "force-dynamic";

import Link from "next/link";
import EventsTable from "@/components/dashboard/events/events-table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  status?: string;
  time?: string;
}>;

function isPast(startsAt: string | null, now: Date) {
  if (!startsAt) return false;
  return new Date(startsAt).getTime() < now.getTime();
}

function filterStatus(status: string, activeStatus: string) {
  if (activeStatus === "all") return true;
  return status === activeStatus;
}

function filterTime(startsAt: string | null, activeTime: string, now: Date) {
  if (activeTime === "all") return true;
  if (activeTime === "past") return isPast(startsAt, now);
  if (activeTime === "future") return !isPast(startsAt, now);
  return true;
}

function tabClass(active: boolean) {
  return active
    ? "rounded-full bg-black px-3 py-1.5 text-sm text-white"
    : "rounded-full border px-3 py-1.5 text-sm text-neutral-700";
}

function buildHref(status: string, time: string) {
  const params = new URLSearchParams();

  if (status !== "all") params.set("status", status);
  if (time !== "all") params.set("time", time);

  const query = params.toString();
  return query ? `/dashboard/events?${query}` : "/dashboard/events";
}

export default async function EventsDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = createSupabaseServerClient();

  const activeStatus = params.status ?? "all";
  const activeTime = params.time ?? "all";

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id,title,slug,location,starts_at,price_cents,capacity,status,access_mode"
    )
    .order("starts_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const now = new Date();

  const filteredEvents = (events ?? []).filter(
    (event) =>
      filterStatus(event.status, activeStatus) &&
      filterTime(event.starts_at, activeTime, now)
  );

  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard Eventi</h1>
          <p className="text-sm text-neutral-500">
            Gestisci eventi, modalità e pubblicazione
          </p>
        </div>

        <Link
          href="/dashboard/events/new"
          className="rounded-lg bg-black px-4 py-2 text-white"
        >
          Crea evento
        </Link>
        <Link
          href="/dashboard/participants"
          className="rounded-lg border px-4 py-2"
        >
          Tutti i partecipanti
        </Link>
      </div>

      <div className="space-y-3 rounded-xl border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Stato:</span>

          <Link
            href={buildHref("all", activeTime)}
            className={tabClass(activeStatus === "all")}
          >
            Tutti
          </Link>

          <Link
            href={buildHref("published", activeTime)}
            className={tabClass(activeStatus === "published")}
          >
            Published
          </Link>

          <Link
            href={buildHref("draft", activeTime)}
            className={tabClass(activeStatus === "draft")}
          >
            Draft
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">Periodo:</span>

          <Link
            href={buildHref(activeStatus, "all")}
            className={tabClass(activeTime === "all")}
          >
            Tutti
          </Link>

          <Link
            href={buildHref(activeStatus, "future")}
            className={tabClass(activeTime === "future")}
          >
            Futuri
          </Link>

          <Link
            href={buildHref(activeStatus, "past")}
            className={tabClass(activeTime === "past")}
          >
            Passati
          </Link>
        </div>

        <p className="text-xs text-neutral-500">
          Eventi trovati: <strong>{filteredEvents.length}</strong>
        </p>
      </div>

      <EventsTable events={filteredEvents} />
    </main>
  );
}