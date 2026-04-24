import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTicketEmail } from "@/lib/email/send-ticket-email";

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function makeCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

function makePassToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const phone = String(body?.phone || "").trim();
    const website = String(body?.website || "").trim();
    const eventSlug = String(body?.event_slug || "").trim();

    if (website) {
      return NextResponse.json({ ok: true });
    }

    if (name.length < 2) {
      return NextResponse.json({ error: "Inserisci un nome valido." }, { status: 400 });
    }

    if (!isEmail(email)) {
      return NextResponse.json({ error: "Inserisci un’email valida." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: "Config Supabase mancante." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let eventQuery = supabase
      .from("events")
      .select("id, title, slug, access_mode, price_cents, location, starts_at, organization_id")
      .eq("status", "published");

    if (eventSlug) {
      eventQuery = eventQuery.eq("slug", eventSlug);
    } else {
      eventQuery = eventQuery.order("starts_at", { ascending: false }).limit(1);
    }

    const { data: event, error: eventError } = await eventQuery.single();

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Nessun evento pubblicato trovato." },
        { status: 404 }
      );
    }

    if (!event.organization_id) {
      return NextResponse.json(
        { error: "Evento senza organization_id." },
        { status: 500 }
      );
    }

    if (event.access_mode === "paid") {
      return NextResponse.json(
        { error: "Questo evento richiede l'acquisto del ticket." },
        { status: 400 }
      );
    }

    let profileId = "";
    let passToken = "";

    const { data: existingProfile, error: profileFindError } = await supabase
      .from("profiles")
      .select("id, email, name, phone, pass_token")
      .eq("email", email)
      .maybeSingle();

    if (profileFindError) {
      return NextResponse.json({ error: "Errore profilo." }, { status: 500 });
    }

    if (existingProfile) {
      profileId = existingProfile.id;
      passToken = existingProfile.pass_token;

      const nextName = existingProfile.name || name;
      const nextPhone = existingProfile.phone || phone || null;

      if (nextName !== existingProfile.name || nextPhone !== existingProfile.phone) {
        const { error: updateProfileError } = await supabase
          .from("profiles")
          .update({
            name: nextName,
            phone: nextPhone,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profileId);

        if (updateProfileError) {
          return NextResponse.json(
            { error: "Errore aggiornamento profilo." },
            { status: 500 }
          );
        }
      }
    } else {
      passToken = makePassToken();

      const { data: newProfile, error: createProfileError } = await supabase
        .from("profiles")
        .insert({
          email,
          name,
          phone: phone || null,
          pass_token: passToken,
        })
        .select("id, pass_token")
        .single();

      if (createProfileError || !newProfile) {
        return NextResponse.json({ error: "Errore creazione profilo." }, { status: 500 });
      }

      profileId = newProfile.id;
      passToken = newProfile.pass_token;
    }

    const { data: existingTicket, error: ticketFindError } = await supabase
      .from("tickets")
      .select("id, code, qr_value, status, payment_status, type")
      .eq("profile_id", profileId)
      .eq("event_id", event.id)
      .in("status", ["active", "used"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ticketFindError) {
      return NextResponse.json({ error: "Errore lettura ticket." }, { status: 500 });
    }

    if (existingTicket) {
      try {
        await sendTicketEmail({
          to: email,
          profileName: name,
          eventTitle: event.title,
          eventLocation: event.location,
          eventStartsAt: event.starts_at,
          ticketCode: existingTicket.code,
          ticketType: existingTicket.type as "free" | "door" | "paid",
          passToken,
        });
      } catch (emailError) {
        console.error("EMAIL RSVP EXISTING TICKET ERROR:", emailError);
      }

      return NextResponse.json({
        ok: true,
        reused: true,
        event,
        code: existingTicket.code,
        pass_token: passToken,
      });
    }

    const code = makeCode();
    const ticketType = event.access_mode === "door" ? "door" : "free";
    const paymentStatus = event.access_mode === "door" ? "pending" : "free";

    const { data: ticket, error: ticketCreateError } = await supabase
      .from("tickets")
      .insert({
        profile_id: profileId,
        event_id: event.id,
        organization_id: event.organization_id,
        code,
        qr_value: code,
        type: ticketType,
        status: "active",
        payment_status: paymentStatus,
        issued_at: new Date().toISOString(),
      })
      .select("id, code, qr_value, type")
      .single();

    if (ticketCreateError || !ticket) {
      return NextResponse.json({ error: "Errore creazione ticket." }, { status: 500 });
    }

    try {
      await sendTicketEmail({
        to: email,
        profileName: name,
        eventTitle: event.title,
        eventLocation: event.location,
        eventStartsAt: event.starts_at,
        ticketCode: ticket.code,
        ticketType: ticket.type as "free" | "door" | "paid",
        passToken,
      });
    } catch (emailError) {
      console.error("EMAIL RSVP ERROR:", emailError);
    }

    return NextResponse.json({
      ok: true,
      event,
      code: ticket.code,
      pass_token: passToken,
    });
  } catch (error) {
    console.error("RSVP API ERROR:", error);
    return NextResponse.json({ error: "Errore server RSVP." }, { status: 500 });
  }
}