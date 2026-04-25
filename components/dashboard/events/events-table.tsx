"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateEventRow } from "@/app/dashboard/events/actions";

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

type RowState = {
  access_mode: AccessMode;
  status: EventStatus;
};

function formatPrice(priceCents: number, accessMode: AccessMode) {
  if (accessMode === "free" || priceCents <= 0) return "Gratis";
  return `€ ${(priceCents / 100).toFixed(2)}`;
}
function modeBadge(accessMode: AccessMode) {
  const classes =
    accessMode === "free"
      ? "bg-green-100 text-green-700"
      : accessMode === "paid"
      ? "bg-purple-100 text-purple-700"
      : "bg-orange-100 text-orange-700";

  const label =
    accessMode === "free"
      ? "Gratuito"
      : accessMode === "paid"
      ? "A pagamento"
      : "Paga all’ingresso";

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

function statusBadge(status: EventStatus) {
  const classes =
    status === "published"
      ? "bg-green-100 text-green-700"
      : "bg-gray-200 text-gray-700";

  const label = status === "published" ? "Pubblicato" : "Draft";

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

function EventTableRow({ event }: { event: EventRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [row, setRow] = useState<RowState>({
    access_mode: event.access_mode as AccessMode,
    status: event.status as EventStatus,
  });

  async function handleSave() {
    startTransition(async () => {
      await updateEventRow(event.id, {
        access_mode: row.access_mode,
        status: row.status,
        });
      router.refresh();
    });
  }

  return (
    <tr className="border-b align-top">
      <td className="p-3">
        <div className="font-medium">{event.title}</div>
        <div className="text-xs text-neutral-500">{event.slug}</div>
      </td>

      <td className="p-3">
        {event.starts_at
          ? new Date(event.starts_at).toLocaleString("it-IT")
          : "—"}
      </td>

      <td className="p-3">{event.location ?? "—"}</td>

      <td className="p-3">
      <div className="flex flex-col gap-2">
        {modeBadge(row.access_mode)}

        <select
          value={row.access_mode}
          onChange={(e) =>
            setRow((prev) => ({
              ...prev,
              access_mode: e.target.value as AccessMode,
            }))
          }
          className="rounded border px-2 py-1 bg-black text-white"
          disabled={isPending}
        >
          <option value="free">Gratuito</option>
          <option value="paid">A pagamento</option>
          <option value="door">Paga all’ingresso</option>
        </select>
      </div>
    </td>

      <td className="p-3">
      <div className="flex flex-col gap-2">
        {statusBadge(row.status)}

        <select
          value={row.status}
          onChange={(e) =>
            setRow((prev) => ({
              ...prev,
              status: e.target.value as EventStatus,
            }))
          }
          className="rounded border px-2 py-1 bg-black text-white"
          disabled={isPending}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>

      </div>
    </td>

      <td className="p-3">{formatPrice(event.price_cents, row.access_mode)}</td>

      <td className="p-3">{event.capacity ?? "—"}</td>

      <td className="p-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            className="rounded border px-2 py-1"
            disabled={isPending}
          >
            {isPending ? "..." : "Salva"}
          </button>

          <Link href={`/dashboard/events/${event.id}`} className="underline">
            Modifica
          </Link>

          <Link
            href={`/scan?key=${encodeURIComponent(
              process.env.NEXT_PUBLIC_SCAN_KEY || ""
            )}&event=${event.id}`}
            className="underline"
            target="_blank"
          >
            Scanner
          </Link>
        </div>
      </td>
    </tr>
  );
}

export default function EventsTable({ events }: { events: EventRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="border-b bg-neutral-50">
          <tr>
            <th className="p-3 text-left">Titolo</th>
            <th className="p-3 text-left">Data</th>
            <th className="p-3 text-left">Location</th>
            <th className="p-3 text-left">Modalità</th>
            <th className="p-3 text-left">Stato</th>
            <th className="p-3 text-left">Prezzo</th>
            <th className="p-3 text-left">Capienza</th>
            <th className="p-3 text-left">Azioni</th>
          </tr>
        </thead>

        <tbody>
          {events.map((event) => (
            <EventTableRow key={event.id} event={event} />
          ))}
        </tbody>
      </table>
    </div>
  );
}