export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_ID } from "@/lib/org";

type Props = {
  params: Promise<{ id: string }>;
};

type TicketRow = {
  id: string;
  code: string | null;
  type: string | null;
  status: string | null;
  payment_status: string | null;
  used_at: string | null;
  created_at?: string | null;
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
};

function getProfile(ticket: TicketRow) {
  if (Array.isArray(ticket.profiles)) return ticket.profiles[0] ?? null;
  return ticket.profiles ?? null;
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

function ParticipantMobileCard({ ticket }: { ticket: TicketRow }) {
  const profile = getProfile(ticket);

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

      <div className="mt-4 flex flex-wrap gap-2">
        {typeBadge(ticket.type)}
        {paymentBadge(ticket.payment_status)}
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black px-3 py-2">
        <div className="text-xs uppercase tracking-[0.14em] text-neutral-500">
          Codice ticket
        </div>
        <div className="mt-1 font-mono text-sm text-white">
          {ticket.code || "—"}
        </div>
      </div>
    </article>
  );
}

function ParticipantsTable({ tickets }: { tickets: TicketRow[] }) {
  if (!tickets.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-neutral-400">
        Nessun partecipante registrato per questo evento.
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

export default async function EventParticipantsPage({ params }: Props) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const [
    { data: organization },
    { data: event, error: eventError },
    { data: tickets, error: ticketsError },
  ] = await Promise.all([
    supabase
      .from("organization_settings")
      .select("id, name, slug")
      .eq("id", ACTIVE_ORG_ID)
      .single(),

    supabase
      .from("events")
      .select("id,title,slug,starts_at,location,access_mode,status,organization_id")
      .eq("organization_id", ACTIVE_ORG_ID)
      .eq("id", id)
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
        created_at,
        organization_id,
        event_id,
        profiles (
          name,
          email,
          phone
        )
      `
      )
      .eq("organization_id", ACTIVE_ORG_ID)
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (eventError || !event) {
    notFound();
  }

  if (ticketsError) {
    throw new Error(ticketsError.message);
  }

  const safeTickets = (tickets ?? []) as TicketRow[];

  const enteredCount = safeTickets.filter((ticket) => Boolean(ticket.used_at)).length;
  const paidCount = safeTickets.filter((ticket) => ticket.payment_status === "paid").length;
  const pendingCount = safeTickets.filter(
    (ticket) => ticket.payment_status === "pending"
  ).length;

  const scannerHref = `/scan?key=${encodeURIComponent(
    process.env.NEXT_PUBLIC_SCAN_KEY || ""
  )}&event=${event.id}`;

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
          <Link
            href="/dashboard/events"
            className="text-sm font-semibold text-neutral-400 transition hover:text-white"
          >
            ← Torna agli eventi
          </Link>

          <h1 className="mt-3 text-3xl font-bold">Partecipanti evento</h1>

          <p className="mt-1 text-sm text-neutral-500">
            {event.title} · {formatDate(event.starts_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/eventi/${event.slug}`}
            target="_blank"
            className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Apri evento
          </Link>

          <Link
            href={scannerHref}
            target="_blank"
            className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
          >
            Scanner
          </Link>

          <Link
            href={`/dashboard/events/${id}/participants/export`}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            Export CSV
          </Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <div className="text-xs uppercase tracking-[0.16em] text-neutral-500">
            Totale
          </div>
          <div className="mt-2 text-3xl font-bold">{safeTickets.length}</div>
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

      <ParticipantsTable tickets={safeTickets} />
    </main>
  );
}