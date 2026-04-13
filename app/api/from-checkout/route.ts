import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { sendTicketEmail } from "@/lib/email/send-ticket-email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function makeCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

function makePassToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "session_id mancante" }, { status: 400 });
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

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Pagamento non completato." }, { status: 400 });
    }

    const email = String(session.customer_details?.email || session.metadata?.email || "")
      .trim()
      .toLowerCase();

    const name = String(session.metadata?.name || session.customer_details?.name || "")
      .trim();

    const phone = String(session.metadata?.phone || "").trim();
    const eventSlug = String(session.metadata?.event_slug || "").trim();

    if (!email) {
      return NextResponse.json({ error: "Email mancante nel checkout." }, { status: 400 });
    }

    let eventQuery = supabase
      .from("events")
      .select("id, title, slug, access_mode, price_cents, location, starts_at")
      .eq("status", "published");

    if (eventSlug) {
      eventQuery = eventQuery.eq("slug", eventSlug);
    } else {
      eventQuery = eventQuery.order("starts_at", { ascending: false }).limit(1);
    }

    const { data: event, error: eventError } = await eventQuery.single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Evento non trovato." }, { status: 404 });
    }

    if (event.access_mode !== "paid") {
      return NextResponse.json(
        { error: "Questo evento non è configurato come paid." },
        { status: 400 }
      );
    }

    let profileId = "";
    let passToken = "";
    let profileName = name;

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
      profileName = existingProfile.name || name;

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
          name: name || null,
          phone: phone || null,
          pass_token: passToken,
        })
        .select("id, pass_token, name")
        .single();

      if (createProfileError || !newProfile) {
        return NextResponse.json({ error: "Errore creazione profilo." }, { status: 500 });
      }

      profileId = newProfile.id;
      passToken = newProfile.pass_token;
      profileName = newProfile.name || name;
    }

    const { data: existingTicket, error: existingTicketError } = await supabase
      .from("tickets")
      .select("id, code, type, payment_status, status")
      .eq("profile_id", profileId)
      .eq("event_id", event.id)
      .eq("stripe_session_id", session.id)
      .maybeSingle();

    if (existingTicketError) {
      return NextResponse.json({ error: "Errore lettura ticket esistente." }, { status: 500 });
    }

    if (existingTicket) {
      try {
        await sendTicketEmail({
          to: email,
          profileName,
          eventTitle: event.title,
          eventLocation: event.location,
          eventStartsAt: event.starts_at,
          ticketCode: existingTicket.code,
          ticketType: "paid",
          passToken,
        });
      } catch (emailError) {
        console.error("EMAIL CHECKOUT EXISTING TICKET ERROR:", emailError);
      }

      return NextResponse.json({
        ok: true,
        code: existingTicket.code,
        pass_token: passToken,
      });
    }

    const code = makeCode();

    const { data: ticket, error: ticketCreateError } = await supabase
      .from("tickets")
      .insert({
        profile_id: profileId,
        event_id: event.id,
        code,
        qr_value: code,
        type: "paid",
        status: "active",
        payment_status: "paid",
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        issued_at: new Date().toISOString(),
      })
      .select("id, code")
      .single();

    if (ticketCreateError || !ticket) {
      return NextResponse.json({ error: "Errore creazione ticket paid." }, { status: 500 });
    }

    try {
      await sendTicketEmail({
        to: email,
        profileName,
        eventTitle: event.title,
        eventLocation: event.location,
        eventStartsAt: event.starts_at,
        ticketCode: ticket.code,
        ticketType: "paid",
        passToken,
      });
    } catch (emailError) {
      console.error("EMAIL CHECKOUT ERROR:", emailError);
    }

    return NextResponse.json({
      ok: true,
      code: ticket.code,
      pass_token: passToken,
    });
  } catch (error) {
    console.error("FROM CHECKOUT ERROR:", error);
    return NextResponse.json({ error: "Errore conferma checkout." }, { status: 500 });
  }
}