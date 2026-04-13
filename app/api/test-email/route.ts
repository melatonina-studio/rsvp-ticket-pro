import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const result = await resend.emails.send({
      from: "Simbiosi <onboarding@resend.dev>",
      to: ["delivered@resend.dev"],
      subject: "Test Resend",
      html: "<p>Test email OK</p>",
    });

    if ((result as any).error) {
      return NextResponse.json(
        { ok: false, result },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("TEST EMAIL ERROR:", error);
    return NextResponse.json(
      { ok: false, error: String(error) },
      { status: 500 }
    );
  }
}