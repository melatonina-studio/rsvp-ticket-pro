export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_ID } from "@/lib/org";

type SearchParams = Promise<{
  q?: string;
  event?: string;
  payment?: string;
  entry?: string;
}>;

type TicketRow = {
  id: string;
  code: string | null;
  type: string | null;
  status: string | null;
  payment_status: string | null;
  used_at: string | null;
  event_id: string | null;
  profiles:
    | {
        name: string | null;
        email: string | null;
        phone: string | null;
      }
    | {
        name: string | null;
        email: string | null;
        phone: string | null;
      }[]
    | null;
  events:
    | {
        id: string;
        title: string | null;
        slug: string | null;
        starts_at: string | null;
      }
    | {
        id: string;
        title: string | null;
        slug: string | null;
        starts_at: string | null;
      }[]
    | null;
};

type EventOption = {
  id: string;
  title: string | null;
  slug: string | null;
  starts_at: string | null;
};

function getProfile(ticket: TicketRow) {
  if (Array.isArray(ticket.profiles)) return ticket.profiles[0] ?? null;
  return ticket.profiles ?? null;
}

function getEvent(ticket: TicketRow) {
  if (Array.isArray(ticket.events)) return ticket.events[0] ?? null;
  return ticket.events ?? null;
}

function buildExportHref(params: {
  q?: string;
  event?: string;
  payment?: string;
  entry?: string;
}) {
  const qs = new URLSearchParams();

  if (params.q) qs.set("q", params.q);
  if (params.event && params.event !== "all") qs.set("event", params.event);
  if (params.payment && params.payment !== "all") {
    qs.set("payment", params.payment);
  }
  if (params.entry && params.entry !== "all") qs.set("entry", params.entry);

  const query = qs.toString();

  return query
    ? `/dashboard/participants/export?${query}`
    : "/dashboard/participants/export";
}

function paymentLabel(value: string | null) {
  if (value === "paid") return "Pagato";
  if (value === "pending") return "Da pagare";
  if (value === "free") return "Gratuito";
  return "—";
}

function paymentBadge(value: string | null) {
  const classes =
    value === "paid"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : value === "pending"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
        : value === "free"
          ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
          : "border-neutral-500/30 bg-neutral-500/10 text-neutral-300";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {paymentLabel(value)}
    </span>
  );
}

function entryBadge(usedAt: string | null) {
  return usedAt ? (
    <span className="inline-flex w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-200">
      Entrato
    </span>
  ) : (
    <span className="inline-flex w-fit rounded-full border border-neutral-500/30 bg-neutral-500/10 px-2.5 py-1 text-xs font-medium text-neutral-300">
      Non entrato
    </span>
  );
}

function typeBadge(value: string | null) {
  const label =
    value === "paid"
      ? "Ticket"
      : value === "door"
        ? "Ingresso"
        : value === "free"
          ? "Lista"
          : value || "—";

  const classes =
    value === "paid"
      ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
      : value === "door"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
        : "border-sky-400/30 bg-sky-400/10 text-sky-200";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Data non impostata";

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function fieldClass() {
  return "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30";
}

function selectClass() {
  return "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition focus:border-white/30";
}

function ParticipantMobileCard({ ticket }: { ticket: TicketRow }) {
  const profile = getProfile(ticket);
  const event = getEvent(ticket);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-white">
            {profile?.name || "Partecipante"}
          </h3>

          <p className="mt-1 truncate text-sm text-neutral-500">
            {profile?.email || "Email non disponibile"}
          </p>

          {profile?.phone ? (
            <p className="mt-1 text-sm text-neutral-500">{profile.phone}</p>
          ) : null}
        </div>

        {entryBadge(ticket.used_at)}
      </div>

      <div className="mt-4 grid gap-3 text-sm">
        <div>
          <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
            Evento
          </div>

          {event ? (
            <Link
              href={`/dashboard/events/${event.id}/participants`}
              className="mt-1 inline-block font-medium text-white underline underline-offset-4"
            >
              {event.title || "Evento"}
            </Link>
          ) : (
            <div className="mt-1 text-neutral-400">—</div>
          )}

          <div className="mt-1 text-xs text-neutral-500">
            {formatDate(event?.starts_at ?? null)}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {typeBadge(ticket.type)}
          {paymentBadge(ticket.payment_status)}
        </div>

        <div className="rounded-xl border border-white/10 bg-black px-3 py-2">
          <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
            Codice ticket
          </div>
          <div className="mt-1 font-mono text-sm text-white">
            {ticket.code || "—"}
          </div>
        </div>
      </div>
    </article>
  );
}

function ParticipantsTable({ tickets }: { tickets: TicketRow[] }) {
  if (!tickets.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-neutral-400">
        Nessun partecipante trovato con questi filtri.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:hidden">
        {tickets.map((ticket) => (
          <ParticipantMobileCard key={ticket.id} ticket={ticket} />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-black lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-white/10 bg-white/[0.04]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Partecipante
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Contatti
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Evento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Codice
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Pagamento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Ingresso
                </th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((ticket) => {
                const profile = getProfile(ticket);
                const event = getEvent(ticket);

                return (
                  <tr
                    key={ticket.id}
                    className="border-b border-white/10 align-top transition hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-white">
                        {profile?.name || "Partecipante"}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-neutral-300">
                        {profile?.email || "—"}
                      </div>
                      {profile?.phone ? (
                        <div className="mt-1 text-xs text-neutral-500">
                          {profile.phone}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      {event ? (
                        <>
                          <Link
                            href={`/dashboard/events/${event.id}/participants`}
                            className="font-medium text-white underline underline-offset-4"
                          >
                            {event.title || "Evento"}
                          </Link>
                          <div className="mt-1 text-xs text-neutral-500">
                            {formatDate(event.starts_at)}
                          </div>
                        </>
                      ) : (
                        <span className="text-neutral-500">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 font-mono text-xs text-neutral-300">
                      {ticket.code || "—"}
                    </td>

                    <td className="px-4 py-4">{typeBadge(ticket.type)}</td>

                    <td className="px-4 py-4">
                      {paymentBadge(ticket.payment_status)}
                    </td>

                    <td className="px-4 py-4">{entryBadge(ticket.used_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
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

  const [
    { data: organization },
    { data: tickets, error: ticketsError },
    { data: events, error: eventsError },
  ] = await Promise.all([
    supabase
      .from("organization_settings")
      .select("id, name, slug")
      .eq("id", ACTIVE_ORG_ID)
      .single(),

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
        organization_id,
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
      .eq("organization_id", ACTIVE_ORG_ID)
      .order("created_at", { ascending: false }),

    supabase
      .from("events")
      .select("id,title,slug,starts_at,organization_id")
      .eq("organization_id", ACTIVE_ORG_ID)
      .order("starts_at", { ascending: false }),
  ]);

  if (ticketsError) {
    throw new Error(ticketsError.message);
  }

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  const filteredTickets = ((tickets ?? []) as TicketRow[]).filter((ticket) => {
    const profile = getProfile(ticket);
    const event = getEvent(ticket);

    const name = profile?.name?.toLowerCase() ?? "";
    const email = profile?.email?.toLowerCase() ?? "";
    const phone = profile?.phone?.toLowerCase() ?? "";
    const code = ticket.code?.toLowerCase() ?? "";
    const eventTitle = event?.title?.toLowerCase() ?? "";

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

  const enteredCount = filteredTickets.filter((ticket) =>
    Boolean(ticket.used_at)
  ).length;

  const paidCount = filteredTickets.filter(
    (ticket) => ticket.payment_status === "paid"
  ).length;

  const pendingCount = filteredTickets.filter(
    (ticket) => ticket.payment_status === "pending"
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
          <h1 className="text-3xl font-bold">Partecipanti</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Ricerca globale tra tutti gli eventi dell’organizzazione.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/events"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Eventi
          </Link>

          <a
            href={buildExportHref({
              q: queryText,
              event: activeEvent,
              payment: activePayment,
              entry: activeEntry,
            })}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Export CSV
          </a>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Totale
          </div>
          <div className="mt-2 text-3xl font-bold">
            {filteredTickets.length}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Entrati
          </div>
          <div className="mt-2 text-3xl font-bold text-emerald-200">
            {enteredCount}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Pagati
          </div>
          <div className="mt-2 text-3xl font-bold text-violet-200">
            {paidCount}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Da pagare
          </div>
          <div className="mt-2 text-3xl font-bold text-amber-200">
            {pendingCount}
          </div>
        </div>
      </section>

      <form className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_190px_190px_auto_auto]">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Cerca
            </label>
            <input
              type="text"
              name="q"
              defaultValue={queryText}
              placeholder="Nome, email, telefono, codice, evento..."
              className={fieldClass()}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Evento
            </label>
            <select
              name="event"
              defaultValue={activeEvent}
              className={selectClass()}
            >
              <option value="all">Tutti gli eventi</option>
              {((events ?? []) as EventOption[]).map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Pagamento
            </label>
            <select
              name="payment"
              defaultValue={activePayment}
              className={selectClass()}
            >
              <option value="all">Tutti</option>
              <option value="paid">Pagati</option>
              <option value="pending">Da pagare</option>
              <option value="free">Gratuiti</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white">
              Ingresso
            </label>
            <select
              name="entry"
              defaultValue={activeEntry}
              className={selectClass()}
            >
              <option value="all">Tutti</option>
              <option value="entered">Entrati</option>
              <option value="not_entered">Non entrati</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
            >
              Filtra
            </button>
          </div>

          <div className="flex items-end">
            <Link
              href="/dashboard/participants"
              className="w-full rounded-xl border border-white/15 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Reset
            </Link>
          </div>
        </div>
      </form>

      <ParticipantsTable tickets={filteredTickets} />
    </main>
  );
}