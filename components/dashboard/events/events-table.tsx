"use client";

import Link from "next/link";

type AccessMode = "free" | "paid" | "door";
type EventStatus = "draft" | "published";

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
};

function normalizeAccessMode(value: string): AccessMode {
  if (value === "paid" || value === "door" || value === "free") return value;
  return "free";
}

function normalizeStatus(value: string): EventStatus {
  if (value === "published" || value === "draft") return value;
  return "draft";
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

function formatPrice(priceCents: number, accessMode: AccessMode) {
  if (accessMode === "free" || priceCents <= 0) return "Gratis";
  return `€ ${(priceCents / 100).toFixed(2)}`;
}

function modeLabel(accessMode: AccessMode) {
  if (accessMode === "free") return "Gratuito";
  if (accessMode === "paid") return "A pagamento";
  return "Paga all’ingresso";
}

function modeBadge(accessMode: AccessMode) {
  const classes =
    accessMode === "free"
      ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
      : accessMode === "paid"
        ? "border-violet-400/30 bg-violet-400/10 text-violet-200"
        : "border-amber-400/30 bg-amber-400/10 text-amber-200";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {modeLabel(accessMode)}
    </span>
  );
}

function statusBadge(status: EventStatus) {
  const classes =
    status === "published"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : "border-neutral-500/30 bg-neutral-500/10 text-neutral-300";

  const label = status === "published" ? "Pubblicato" : "Draft";

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {label}
    </span>
  );
}

function EventActions({ event }: { event: EventRow }) {
  const scannerHref = `/scan?key=${encodeURIComponent(
    process.env.NEXT_PUBLIC_SCAN_KEY || ""
  )}&event=${event.id}`;

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/dashboard/events/${event.id}`}
        className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
      >
        Modifica
      </Link>
      <Link
        href={`/dashboard/events/${event.id}/participants`}
        className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
      >
        Lista
      </Link>
      <Link
        href={`/eventi/${event.slug}`}
        className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        target="_blank"
      >
        Apri evento
      </Link>
      <Link
        href={scannerHref}
        className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/20"
        target="_blank"
      >
        Scanner
      </Link>
    </div>
  );
}

function EventTableRow({ event }: { event: EventRow }) {
  const accessMode = normalizeAccessMode(event.access_mode);
  const status = normalizeStatus(event.status);

  return (
    <tr className="border-b border-white/10 align-top transition hover:bg-white/[0.03]">
      <td className="px-4 py-4">
        <div className="font-semibold text-white">{event.title}</div>
        <div className="mt-1 text-xs text-neutral-500">{event.slug}</div>
      </td>

      <td className="px-4 py-4 text-neutral-300">
        {formatDate(event.starts_at)}
      </td>

      <td className="px-4 py-4 text-neutral-300">
        {event.location ?? "Location non impostata"}
      </td>

      <td className="px-4 py-4">{modeBadge(accessMode)}</td>

      <td className="px-4 py-4">{statusBadge(status)}</td>

      <td className="px-4 py-4 font-medium text-white">
        {formatPrice(event.price_cents, accessMode)}
      </td>

      <td className="px-4 py-4 text-neutral-300">{event.capacity ?? "—"}</td>

      <td className="min-w-[260px] px-4 py-4">
        <EventActions event={event} />
      </td>
    </tr>
  );
}

function EventMobileCard({ event }: { event: EventRow }) {
  const accessMode = normalizeAccessMode(event.access_mode);
  const status = normalizeStatus(event.status);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{event.title}</h3>
          <div className="mt-1 text-xs text-neutral-500">{event.slug}</div>
        </div>

        {statusBadge(status)}
      </div>

      <div className="mt-4 grid gap-2 text-sm text-neutral-300">
        <div>
          <span className="text-neutral-500">Data: </span>
          {formatDate(event.starts_at)}
        </div>

        <div>
          <span className="text-neutral-500">Location: </span>
          {event.location ?? "Location non impostata"}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {modeBadge(accessMode)}

          <span className="font-medium text-white">
            {formatPrice(event.price_cents, accessMode)}
          </span>

          <span className="text-neutral-500">
            Capienza: {event.capacity ?? "—"}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <EventActions event={event} />
      </div>
    </article>
  );
}

export default function EventsTable({ events }: { events: EventRow[] }) {
  if (!events.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-neutral-400">
        Nessun evento trovato.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:hidden">
        {events.map((event) => (
          <EventMobileCard key={event.id} event={event} />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-black lg:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-white/10 bg-white/[0.04]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Evento
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Modalità
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Stato
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Prezzo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Capienza
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Azioni
                </th>
              </tr>
            </thead>

            <tbody>
              {events.map((event) => (
                <EventTableRow key={event.id} event={event} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}