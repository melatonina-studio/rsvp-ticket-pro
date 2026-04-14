export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<{
  q?: string;
  event?: string;
  payment?: string;
  entry?: string;
}>;

function tabClass(active: boolean) {
  return active
    ? "rounded-full bg-black px-3 py-1.5 text-sm text-white"
    : "rounded-full border px-3 py-1.5 text-sm text-neutral-700";
}

function buildHref(params: {
  q?: string;
  event?: string;
  payment?: string;
  entry?: string;
}) {
  const qs = new URLSearchParams();

  if (params.q) qs.set("q", params.q);
  if (params.event && params.event !== "all") qs.set("event", params.event);
  if (params.payment && params.payment !== "all")
    qs.set("payment", params.payment);
  if (params.entry && params.entry !== "all") qs.set("entry", params.entry);

  const query = qs.toString();
  return query ? `/dashboard/participants?${query}` : "/dashboard/participants";
}

export default async function ParticipantsDashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const supabase = createSupabaseServerClient();

  const queryText = (params.q ?? "").trim().toLowerCase();
  const activeEvent = params.event ?? "all";
  const activePayment = params.payment ?? "all";
  const activeEntry = params.entry ?? "all";

  const [{ data: tickets, error: ticketsError }, { data: events, error: eventsError }] =
    await Promise.all([
      supabase
        .from("tickets")
        .select(
          `
          id,
          code,
          type,
          status,
          payment_status,
          used_at,
          event_id,
          profiles (
            name,
            email,
            phone
          ),
          events (
            id,
            title,
            slug,
            starts_at
          )
        `
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("events")
        .select("id,title,slug,starts_at")
        .order("starts_at", { ascending: false }),
    ]);

  if (ticketsError) {
    throw new Error(ticketsError.message);
  }

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  const filteredTickets = (tickets ?? []).filter((ticket: any) => {
    const name = ticket.profiles?.name?.toLowerCase() ?? "";
    const email = ticket.profiles?.email?.toLowerCase() ?? "";
    const phone = ticket.profiles?.phone?.toLowerCase() ?? "";
    const code = ticket.code?.toLowerCase() ?? "";
    const eventTitle = ticket.events?.title?.toLowerCase() ?? "";

    const matchesQuery =
      !queryText ||
      name.includes(queryText) ||
      email.includes(queryText) ||
      phone.includes(queryText) ||
      code.includes(queryText) ||
      eventTitle.includes(queryText);

    const matchesEvent =
      activeEvent === "all" || ticket.event_id === activeEvent;

    const matchesPayment =
      activePayment === "all" || ticket.payment_status === activePayment;

    const matchesEntry =
      activeEntry === "all" ||
      (activeEntry === "entered" && Boolean(ticket.used_at)) ||
      (activeEntry === "not_entered" && !ticket.used_at);

    return matchesQuery && matchesEvent && matchesPayment && matchesEntry;
  });
  function buildExportHref(params: {
  q?: string;
  event?: string;
  payment?: string;
  entry?: string;
}) {
  const qs = new URLSearchParams();

  if (params.q) qs.set("q", params.q);
  if (params.event && params.event !== "all") qs.set("event", params.event);
  if (params.payment && params.payment !== "all") qs.set("payment", params.payment);
  if (params.entry && params.entry !== "all") qs.set("entry", params.entry);

  const query = qs.toString();
  return query
    ? `/dashboard/participants/export?${query}`
    : "/dashboard/participants/export";
}
  return (
    <main className="space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Tutti i partecipanti</h1>
          <p className="text-sm text-neutral-500">
            Ricerca globale tra tutti gli eventi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard/events" className="text-sm underline">
            ← Torna agli eventi
          </Link>
        </div>
      </div>

      <form className="space-y-4 rounded-xl border p-4">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_180px_180px_auto_auto]">
          <div>
            <label className="mb-1 block text-sm font-medium">Cerca</label>
            <input
              type="text"
              name="q"
              defaultValue={queryText}
              placeholder="Nome, email, telefono, codice ticket, evento..."
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Evento</label>
            <select
              name="event"
              defaultValue={activeEvent}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="all">Tutti gli eventi</option>
              {(events ?? []).map((event: any) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Pagamento</label>
            <select
              name="payment"
              defaultValue={activePayment}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="all">Tutti</option>
              <option value="paid">Pagati</option>
              <option value="pending">Da pagare</option>
              <option value="free">Gratuiti</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Ingresso</label>
            <select
              name="entry"
              defaultValue={activeEntry}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="all">Tutti</option>
              <option value="entered">Entrati</option>
              <option value="not_entered">Non entrati</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-black px-4 py-2 text-white"
            >
              Cerca
            </button>
          </div>

          <div className="flex items-end">
            <Link
              href={buildExportHref({
                q: queryText,
                event: activeEvent,
                payment: activePayment,
                entry: activeEntry,
              })}
              className="w-full rounded-lg border px-4 py-2 text-center text-sm"
            >
              Export CSV
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-neutral-500">
            Partecipanti trovati: <strong>{filteredTickets.length}</strong>
          </p>

          <Link href="/dashboard/participants" className="text-sm underline">
            Reset filtri
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-neutral-50">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Telefono</th>
              <th className="p-3 text-left">Evento</th>
              <th className="p-3 text-left">Codice</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Pagamento</th>
              <th className="p-3 text-left">Ingresso</th>
            </tr>
          </thead>

          <tbody>
            {filteredTickets.map((ticket: any) => (
              <tr key={ticket.id} className="border-b">
                <td className="p-3">{ticket.profiles?.name ?? "—"}</td>
                <td className="p-3">{ticket.profiles?.email ?? "—"}</td>
                <td className="p-3">{ticket.profiles?.phone ?? "—"}</td>

                <td className="p-3">
                  {ticket.events ? (
                    <Link
                      href={`/dashboard/events/${ticket.events.id}/participants`}
                      className="underline"
                    >
                      {ticket.events.title}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="p-3 font-mono text-xs">{ticket.code}</td>
                <td className="p-3">{ticket.type ?? "—"}</td>

                <td className="p-3">
                  {ticket.payment_status === "paid" ? (
                    <span className="text-green-600">Pagato</span>
                  ) : ticket.payment_status === "pending" ? (
                    <span className="text-orange-600">Da pagare</span>
                  ) : ticket.payment_status === "free" ? (
                    <span className="text-neutral-600">Gratuito</span>
                  ) : (
                    <span className="text-neutral-500">—</span>
                  )}
                </td>

                <td className="p-3">
                  {ticket.used_at ? (
                    <span className="text-green-600">Entrato</span>
                  ) : (
                    <span className="text-neutral-500">Non entrato</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}