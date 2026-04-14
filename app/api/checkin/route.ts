import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ProfileJoin =
  | {
      name: string | null;
      email: string | null;
    }
  | Array<{
      name: string | null;
      email: string | null;
    }>
  | null;

type EventJoin =
  | {
      title: string | null;
      access_mode: string | null;
    }
  | Array<{
      title: string | null;
      access_mode: string | null;
    }>
  | null;

export async function POST(req: Request) {
  try {
    const { code, eventId } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { status: "error", error: "Codice mancante o non valido" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const { data: ticket, error } = await supabase
      .from("tickets")
      .select(`
        id,
        code,
        payment_status,
        used_at,
        event_id,
        profile_id,
        profiles (
          name,
          email
        ),
        events (
          title,
          access_mode
        )
      `)
      .eq("code", code.trim())
      .single();

    console.log("CHECKIN CODE:", code);
    console.log("CHECKIN EVENT ID:", eventId);
    console.log("CHECKIN TICKET:", ticket);
    console.log("CHECKIN ERROR:", error);

    if (error || !ticket) {
      return NextResponse.json({
        status: "not_found",
      });
    }

    if (eventId && ticket.event_id !== eventId) {
      return NextResponse.json({
        status: "not_found",
      });
    }

    const profileJoin = ticket.profiles as ProfileJoin;
    const eventJoin = ticket.events as EventJoin;

    const profile = Array.isArray(profileJoin) ? profileJoin[0] : profileJoin;
    const event = Array.isArray(eventJoin) ? eventJoin[0] : eventJoin;

    if (ticket.used_at) {
      return NextResponse.json({
        status: "already",
        name: profile?.name ?? "",
        email: profile?.email ?? "",
        checkedInAt: ticket.used_at,
        eventTitle: event?.title ?? "",
        paymentStatus: ticket.payment_status ?? "",
        accessMode: event?.access_mode ?? "",
      });
    }

    const patch: {
      used_at: string;
      payment_status?: string;
    } = {
      used_at: new Date().toISOString(),
    };

    if (event?.access_mode === "door" && ticket.payment_status === "pending") {
      patch.payment_status = "paid";
    }

    const { error: updateError } = await supabase
      .from("tickets")
      .update(patch)
      .eq("id", ticket.id);

    if (updateError) {
      return NextResponse.json(
        {
          status: "error",
          error: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      name: profile?.name ?? "",
      email: profile?.email ?? "",
      eventTitle: event?.title ?? "",
      paymentStatus: patch.payment_status ?? ticket.payment_status ?? "",
      accessMode: event?.access_mode ?? "",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        error: error?.message ?? "Errore sconosciuto",
      },
      { status: 500 }
    );
  }
}