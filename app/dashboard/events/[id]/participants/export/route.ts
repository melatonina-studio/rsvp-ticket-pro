import { createSupabaseServerClient } from "@/lib/supabase/server";

function escapeCsv(value: unknown) {
  const stringValue = String(value ?? "");
  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const [{ data: tickets, error: ticketsError }, { data: event, error: eventError }] =
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
          profiles (
            name,
            email,
            phone
          )
        `
        )
        .eq("event_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("events")
        .select("title,slug,starts_at")
        .eq("id", id)
        .single(),
    ]);

  if (ticketsError) {
    return new Response(`Errore export CSV: ${ticketsError.message}`, {
      status: 500,
    });
  }

  if (eventError) {
    return new Response(`Errore evento: ${eventError.message}`, {
      status: 500,
    });
  }

  const headers = [
    "Nome",
    "Email",
    "Telefono",
    "Evento",
    "Slug Evento",
    "Data Evento",
    "Codice Ticket",
    "Tipo Ticket",
    "Stato Ticket",
    "Stato Pagamento",
    "Ingresso",
    "Usato il",
  ];

  const rows = (tickets ?? []).map((ticket: any) => [
    ticket.profiles?.name ?? "",
    ticket.profiles?.email ?? "",
    ticket.profiles?.phone ?? "",
    event?.title ?? "",
    event?.slug ?? "",
    event?.starts_at ?? "",
    ticket.code ?? "",
    ticket.type ?? "",
    ticket.status ?? "",
    ticket.payment_status ?? "",
    ticket.used_at ? "Entrato" : "Non entrato",
    ticket.used_at ?? "",
  ]);

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  const safeSlug = (event?.slug ?? "event").replace(/[^a-z0-9-_]/gi, "-");
  const timestamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeSlug}-participants-${timestamp}.csv"`,
    },
  });
}