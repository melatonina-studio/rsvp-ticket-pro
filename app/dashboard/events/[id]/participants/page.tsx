export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EventParticipantsPage({ params }: Props) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const { data: tickets, error } = await supabase
    .from("tickets")
    .select(
      `
      id,
      code,
      type,
      status,
      payment_status,
      used_at,
      profiles (
        name,
        email,
        phone
      )
    `
    )
    .eq("event_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Partecipanti evento</h1>

        <Link
          href="/dashboard/events"
          className="text-sm underline"
        >
          ← Torna agli eventi
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-neutral-50">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Telefono</th>
              <th className="p-3 text-left">Codice</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Pagamento</th>
              <th className="p-3 text-left">Ingresso</th>
            </tr>
          </thead>

          <tbody>
            {(tickets ?? []).map((ticket: any) => (
              <tr key={ticket.id} className="border-b">
                <td className="p-3">{ticket.profiles?.name ?? "—"}</td>
                <td className="p-3">{ticket.profiles?.email ?? "—"}</td>
                <td className="p-3">{ticket.profiles?.phone ?? "—"}</td>

                <td className="p-3 font-mono text-xs">{ticket.code}</td>

                <td className="p-3">{ticket.type ?? "—"}</td>

                <td className="p-3">
                  {ticket.payment_status === "paid" ? (
                    <span className="text-green-600">Pagato</span>
                  ) : ticket.payment_status === "pending" ? (
                    <span className="text-orange-600">Da pagare</span>
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