import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const name = String(body?.name || "").trim();
    const email = String(body?.email || "").trim().toLowerCase();
    const phone = String(body?.phone || "").trim();
    const eventSlug = String(body?.event_slug || "").trim();

    const supabase = createSupabaseServerClient();

    let eventQuery = supabase
      .from("events")
      .select("id, title, slug, access_mode, price_cents")
      .eq("status", "published");

    if (eventSlug) {
      eventQuery = eventQuery.eq("slug", eventSlug);
    } else {
      eventQuery = eventQuery.order("starts_at", { ascending: false }).limit(1);
    }

    const { data: event, error: eventError } = await eventQuery.single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Evento non trovato" }, { status: 404 });
    }

    if (event.access_mode !== "paid") {
      return NextResponse.json(
        { error: "Questo evento non è configurato come pagamento online." },
        { status: 400 }
      );
    }

    const amount = event.price_cents ?? 1000;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: event.title || "Ticket Evento",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        name,
        email,
        phone,
        event_slug: event.slug,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: "Errore Stripe" }, { status: 500 });
  }
}