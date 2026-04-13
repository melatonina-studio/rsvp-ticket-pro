export const dynamic = "force-dynamic";

import Link from "next/link";
import EventsTable from "@/components/dashboard/events/events-table";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EventsDashboardPage() {
  const supabase = createSupabaseServerClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id,title,slug,location,starts_at,price_cents,capacity,status,access_mode"
    )
    .order("starts_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4">
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
      </div>

      <EventsTable events={events ?? []} />
    </main>
  );
}