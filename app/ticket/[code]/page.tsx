import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import TicketClient from "./TicketClient";
import MemberHeader from "@/components/MemberHeader";

type TicketPageProps = {
  params: Promise<{ code: string }>;
};

export default async function TicketPage({ params }: TicketPageProps) {
  const { code } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(`
      id,
      code,
      qr_value,
      type,
      status,
      payment_status,
      issued_at,
      used_at,
      profiles (
        id,
        name,
        email,
        phone,
        pass_token
      ),
      events (
        id,
        title,
        slug,
        description,
        location,
        starts_at,
        ends_at,
        price_cents,
        poster_url,
        lineup_text,
        playlist_1_url,
        playlist_2_url
      )
    `)
    .eq("code", code)
    .single();

  if (error || !ticket) {
    notFound();
  }

  const profile = Array.isArray(ticket.profiles) ? ticket.profiles[0] : ticket.profiles;
  const event = Array.isArray(ticket.events) ? ticket.events[0] : ticket.events;

  if (!event || !profile) {
    notFound();
  }

  return (
    <>
      <MemberHeader passToken={profile.pass_token} />
      <TicketClient
        ticket={{
          code: ticket.code,
          qr_value: ticket.qr_value,
          type: ticket.type,
          status: ticket.status,
          payment_status: ticket.payment_status,
        }}
        profile={{
          name: profile.name || "",
          email: profile.email || "",
          phone: profile.phone || "",
          pass_token: profile.pass_token || "",
        }}
        event={{
          title: event.title || "",
          description: event.description || "",
          location: event.location || "",
          starts_at: event.starts_at || "",
          price_cents: event.price_cents ?? null,
          poster_url: event.poster_url || "/cover-planet.jpg",
          lineup_text: event.lineup_text || "",
          playlist_1_url: event.playlist_1_url || "",
          playlist_2_url: event.playlist_2_url || "",
        }}
      />
    </>
  );
}

