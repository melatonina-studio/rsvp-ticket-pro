import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_ID } from "@/lib/org";

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
    }
  | Array<{
      title: string | null;
    }>
  | null;

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();

    const { data, error } = await supabase
      .from("tickets")
      .select(`
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
      `)
      .eq("organization_id", ACTIVE_ORG_ID)
      .not("used_at", "is", null)
      .order("used_at", { ascending: false });
      

    if (error) {
      return NextResponse.json(
        { count: 0, entries: [], error: error.message },
        { status: 500 }
      );
    }

    const entries = (data ?? []).map((item: any) => {
      const profileJoin = item.profiles as ProfileJoin;
      const eventJoin = item.events as EventJoin;

      const profile = Array.isArray(profileJoin) ? profileJoin[0] : profileJoin;
      const event = Array.isArray(eventJoin) ? eventJoin[0] : eventJoin;

      return {
        name: profile?.name ?? "",
        email: profile?.email ?? "",
        code: item.code ?? "",
        eventTitle: event?.title ?? "",
        paymentStatus: item.payment_status ?? "",
        checkedInAt: item.used_at ?? "",
      };
    });

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