import { notFound } from "next/navigation";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {formatEventDate,formatEventTime,ticketStatusLabel,ticketStatusTone} from "@/lib/utils/format";
import MemberHeader from "@/components/MemberHeader";

type PassPageProps = {
  params: Promise<{ token: string }>;
};

type EventRow = {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  starts_at: string | null;
  ends_at: string | null;
  poster_url?: string | null;
};

type TicketRow = {
  id: string;
  code: string;
  type: string;
  status: string;
  payment_status: string;
  created_at: string;
  issued_at: string | null;
  used_at: string | null;
  events: EventRow | null;
};

export default async function PassPage({ params }: PassPageProps) {
  const { token } = await params;
  const supabase = createSupabaseServerClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, name, email, phone, pass_token")
    .eq("pass_token", token)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  const { data, error: ticketsError } = await supabase
    .from("tickets")
    .select(`
      id,
      code,
      type,
      status,
      payment_status,
      created_at,
      issued_at,
      used_at,
      events (
        id,
        title,
        slug,
        location,
        starts_at,
        ends_at,
        poster_url
      )
    `)
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false });

  if (ticketsError) {
    notFound();
  }

  const tickets = (data ?? []) as unknown as TicketRow[];

  const now = Date.now();

const sortedByEventDate = [...tickets].sort((a, b) => {
  const aTime = a.events?.starts_at ? new Date(a.events.starts_at).getTime() : 0;
  const bTime = b.events?.starts_at ? new Date(b.events.starts_at).getTime() : 0;
  return aTime - bTime;
});

const upcomingTickets = sortedByEventDate.filter((ticket) => {
  const startsAt = ticket.events?.starts_at;
  if (!startsAt) return false;
  return new Date(startsAt).getTime() >= now;
});

const pastTickets = [...sortedByEventDate]
  .filter((ticket) => {
    const startsAt = ticket.events?.starts_at;
    if (!startsAt) return false;
    return new Date(startsAt).getTime() < now;
  })
  .reverse();

const featuredTicket = upcomingTickets[0] || null;

  return (
    <>
    <main
      style={{
        minHeight: "100vh",
        background: "#030303",
        color: "#fff",
        padding: "28px 18px 60px",
        overflowX: "hidden",
      }}
    >
      <MemberHeader passToken={token} />
      <div className="pass-page-wrap">
        <section id="profile"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 28,
            background: "rgba(12,12,16,0.78)",
            backdropFilter: "blur(16px)",
            padding: "24px",
            marginBottom: 24,
          }}
        >
          <p style={{ margin: 0, opacity: 0.7 }}>Profilo</p>
          <h1 style={{ margin: "8px 0 10px", fontSize: 40, lineHeight: 1.05 }}>
            {profile.name || "Utente"}
          </h1>
          <p style={{ margin: 0, opacity: 0.78, fontSize: 16 }}>
            {profile.email}
            {profile.phone ? ` · ${profile.phone}` : ""}
          </p>
        </section>

        {featuredTicket ? (
          <section id="tickets"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 28,
              background: "rgba(12,12,16,0.78)",
              backdropFilter: "blur(16px)",
              padding: "24px",
              marginBottom: 30,
            }}
          >
            <p style={{ margin: 0, opacity: 0.72 }}>Prossimo evento</p>

            <div className="pass-featured-grid">
              <div className="pass-featured-poster">
                <Image
                  src={
                    featuredTicket.events?.poster_url &&
                    featuredTicket.events.poster_url.startsWith("/")
                      ? featuredTicket.events.poster_url
                      : "/cover-planet.jpg"
                  }
                  alt={featuredTicket.events?.title || "Poster evento"}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>

              <div className="pass-featured-content">
                <h2 style={{ marginTop: 0, marginBottom: 10, fontSize: 34, lineHeight: 1 }}>
                  {featuredTicket.events?.title || "Evento"}
                </h2>

                <div style={{ opacity: 0.8, marginBottom: 8, fontSize: 16 }}>
                  {featuredTicket.events?.location || "Location da definire"}
                </div>

                <div style={{ opacity: 0.8, marginBottom: 18, fontSize: 16 }}>
                  {formatEventDate(featuredTicket.events?.starts_at || null)} ·{" "}
                  {formatEventTime(featuredTicket.events?.starts_at || null)}
                </div>

                {(() => {
                  const tone = ticketStatusTone(
                    featuredTicket.type,
                    featuredTicket.status,
                    featuredTicket.payment_status,
                    featuredTicket.events?.starts_at || null
                  );

                  return (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 12px",
                        borderRadius: 999,
                        border: `1px solid ${tone.border}`,
                        background: tone.background,
                        color: tone.color,
                        marginBottom: 18,
                        fontSize: 14,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: tone.color,
                          display: "inline-block",
                          boxShadow: `0 0 10px ${tone.color}`,
                        }}
                      />
                      <span>
                        {ticketStatusLabel(
                          featuredTicket.type,
                          featuredTicket.status,
                          featuredTicket.payment_status,
                          featuredTicket.events?.starts_at || null
                        )}
                      </span>
                    </div>
                  );
                })()}

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <a
                    href={`/ticket/${featuredTicket.code}`}
                    style={{
                      textDecoration: "none",
                      color: "#000",
                      background: "#fff",
                      padding: "14px 18px",
                      borderRadius: 16,
                      fontWeight: 700,
                    }}
                  >
                   Mostra ticket
                  </a>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <section id="past">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 28 }}>I miei Ticket passati</h3>
            <div style={{ opacity: 0.55, fontSize: 14 }}>
              {pastTickets.length} elementi
            </div>
          </div>

          {pastTickets.length ? (
            <div className="pass-past-rail">
              {pastTickets.map((ticket) => (
                <a
                  key={ticket.id}
                  href={`/ticket/${ticket.code}`}
                  className="pass-past-card"
                  style={{
                    textDecoration: "none",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 22,
                    overflow: "hidden",
                    background: "rgba(12,12,16,0.78)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "3 / 4",
                      background: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <Image
                      src={
                        ticket.events?.poster_url &&
                        ticket.events.poster_url.startsWith("/")
                          ? ticket.events.poster_url
                          : "/cover-planet.jpg"
                      }
                      alt={ticket.events?.title || "Poster evento"}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  </div>

                  <div style={{ padding: 14 }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        marginBottom: 6,
                        lineHeight: 1.15,
                      }}
                    >
                      {ticket.events?.title || "Evento"}
                    </div>

                    <div style={{ opacity: 0.72, fontSize: 14, marginBottom: 4 }}>
                      {ticket.events?.location || "Location"}
                    </div>

                    <div style={{ opacity: 0.72, fontSize: 14, marginBottom: 10 }}>
                      {formatEventDate(ticket.events?.starts_at || null)} ·{" "}
                      {formatEventTime(ticket.events?.starts_at || null)}
                    </div>

                    {(() => {
                      const tone = ticketStatusTone(
                        ticket.type,
                        ticket.status,
                        ticket.payment_status,
                        ticket.events?.starts_at || null
                      );

                      return (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "7px 10px",
                            borderRadius: 999,
                            border: `1px solid ${tone.border}`,
                            background: tone.background,
                            color: tone.color,
                            fontSize: 12,
                          }}
                        >
                          <span
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              background: tone.color,
                              display: "inline-block",
                            }}
                          />
                          <span>
                           {ticketStatusLabel(
                            ticket.type,
                            ticket.status,
                            ticket.payment_status,
                            ticket.events?.starts_at || null
                          )}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </a>
              ))}
            </div>
    
          ) : (
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 22,
                background: "rgba(12,12,16,0.78)",
                padding: 22,
                opacity: 0.78,
              }}
            >
              Nessun evento passato da mostrare.
            </div>
          )}
        </section>
      </div>
    </main>
    <style>{`
  .pass-page-wrap {
    max-width: 1120px;
    margin: 0 auto;
  }

  .pass-featured-grid {
    display: grid;
    grid-template-columns: minmax(220px, 320px) 1fr;
    gap: 22px;
    align-items: stretch;
    margin-top: 18px;
  }

  .pass-featured-poster {
    position: relative;
    width: 100%;
    aspect-ratio: 3 / 4;
    border-radius: 22px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
  }

  .pass-featured-content {
    min-width: 0;
  }

  @media (max-width: 860px) {
    .pass-featured-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .pass-featured-poster {
      max-width: 360px;
    }

    .pass-featured-content h2 {
      font-size: 28px !important;
    }
  }

  @media (max-width: 640px) {
    .pass-featured-poster {
      max-width: 100%;
      border-radius: 18px;
    }

    .pass-featured-content h2 {
      font-size: 24px !important;
    }
  }
    .pass-past-rail {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 160px;
  gap: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 8px;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;
}

.pass-past-card {
  scroll-snap-align: start;
  min-width: 0;
}

.pass-past-rail::-webkit-scrollbar {
  height: 8px;
}

.pass-past-rail::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.14);
  border-radius: 999px;
}

@media (max-width: 640px) {
  .pass-past-rail {
    grid-auto-columns: 155px;
    gap: 12px;
  }
}
`}</style>
    </>
  );
}