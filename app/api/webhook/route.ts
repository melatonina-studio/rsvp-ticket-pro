import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  try {
    const rawBody = await req.text();

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const email =
        session.customer_details?.email ||
        session.customer_email ||
        session.metadata?.email ||
        "";

      const name =
        session.metadata?.name ||
        session.customer_details?.name ||
        "";

      // QUI DOPO:
      // 1) generi code ticket
      // 2) salvi su database
      // 3) generi QR
      // 4) mandi email
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WEBHOOK ERROR:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}