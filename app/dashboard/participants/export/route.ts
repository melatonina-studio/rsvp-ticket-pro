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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const activeEvent = searchParams.get("event") ?? "all";
  const activePayment = searchParams.get("payment") ?? "all";
  const activeEntry = searchParams.get("entry") ?? "all";

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
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(`Errore export CSV: ${error.message}`, { status: 500 });
  }

  const filteredTickets = (tickets ?? []).filter((ticket: any) => {
    const name = ticket.profiles?.name?.toLowerCase() ?? "";
    const email = ticket.profiles?.email?.toLowerCase() ?? "";
    const phone = ticket.profiles?.phone?.toLowerCase() ?? "";
    const code = ticket.code?.toLowerCase() ?? "";
    const eventTitle = ticket.events?.title?.toLowerCase() ?? "";

    const matchesQuery =
      !q ||
      name.includes(q) ||
      email.includes(q) ||
      phone.includes(q) ||
      code.includes(q) ||
      eventTitle.includes(q);

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

  const rows = filteredTickets.map((ticket: any) => [
    ticket.profiles?.name ?? "",
    ticket.profiles?.email ?? "",
    ticket.profiles?.phone ?? "",
    ticket.events?.title ?? "",
    ticket.events?.slug ?? "",
    ticket.events?.starts_at ?? "",
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

  const timestamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="participants-${timestamp}.csv"`,
    },
  });
}