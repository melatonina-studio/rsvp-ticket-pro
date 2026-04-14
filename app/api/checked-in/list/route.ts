import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
        id,
        code,
        used_at,
        payment_status,
        profiles (
          name,
          email
        ),
        events (
          title
        )
      `
      )
      .not("used_at", "is", null)
      .order("used_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { count: 0, entries: [], error: error.message },
        { status: 500 }
      );
    }

    const entries = (data ?? []).map((item: any) => ({
      name: item.profiles?.name ?? "",
      email: item.profiles?.email ?? "",
      code: item.code ?? "",
      eventTitle: item.events?.title ?? "",
      paymentStatus: item.payment_status ?? "",
      checkedInAt: item.used_at ?? "",
    }));

    return NextResponse.json({
      count: entries.length,
      entries,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        count: 0,
        entries: [],
        error: error?.message ?? "Errore sconosciuto",
      },
      { status: 500 }
    );
  }
}