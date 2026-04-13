import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/PublicHeader";

type EventCard = {
  id: string;
  title: string;
  slug: string;
  location: string | null;
  starts_at: string;
  poster_url: string | null;
  access_mode: string;
};

function formatCardDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export default async function HomePage() {
  const supabase = createSupabaseServerClient();
  const nowIso = new Date().toISOString();

  const { data: upcoming } = await supabase
    .from("events")
    .select("id, title, slug, location, starts_at, poster_url, access_mode")
    .eq("status", "published")
    .gte("starts_at", nowIso)
    .order("starts_at", { ascending: true });

  const { data: past } = await supabase
    .from("events")
    .select("id, title, slug, location, starts_at, poster_url, access_mode")
    .eq("status", "published")
    .lt("starts_at", nowIso)
    .order("starts_at", { ascending: false });

  const upcomingEvents = (upcoming ?? []) as EventCard[];
  const pastEvents = (past ?? []) as EventCard[];
  
  function eventModeLabel(mode: string) {
  if (mode === "free") return "Gratuito";
  if (mode === "paid") return "A pagamento";
  if (mode === "door") return "All’ingresso";
  return mode;
}

function eventModeStyle(mode: string) {
  if (mode === "free") {
    return {
      border: "1px solid rgba(125,211,252,0.35)",
      background: "rgba(125,211,252,0.10)",
      color: "#b9e6ff",
    };
  }

  if (mode === "paid") {
    return {
      border: "1px solid rgba(252,211,77,0.35)",
      background: "rgba(252,211,77,0.10)",
      color: "#ffe59a",
    };
  }

  return {
    border: "1px solid rgba(196,181,253,0.35)",
    background: "rgba(196,181,253,0.10)",
    color: "#ddd2ff",
  };
}
  return (
    <>
      <SiteHeader />
      <main
        style={{
          minHeight: "100vh",
          background: "#030303",
          color: "#fff",
        }}
      >

      <section className="hero">
        <video className="hero-video" autoPlay muted loop playsInline>
          <source src="/bg.mp4" type="video/mp4" />
        </video>

        <div className="hero-overlay" />

        <div className="hero-content">
          <p className="hero-eyebrow">SIMBIOSI SONORE</p>

          <h1 className="hero-title">
            EVENTI, TICKET
            <br />
            E PASS DIGITALE
          </h1>

          <p className="hero-sub">
            Entra nell’ecosistema Simbiosi. Scopri gli eventi in programma,
            acquista il ticket o richiedi l’accesso, e conserva tutto nel tuo pass digitale.
          </p>
        </div>
      </section>
      <EventRail title="Eventi in programma" events={upcomingEvents} />
      <EventRail title="Eventi passati" events={pastEvents} />
      </main>
    </>
  );
}

function EventRail({ title, events }: { title: string; events: EventCard[] }) {
  return (
    <section style={{ padding: "28px 22px 8px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 28 }}>{title}</h2>
        <span style={{ opacity: 0.5, fontSize: 13 }}>{events.length} eventi</span>
      </div>

      {events.length ? (
        <div
          style={{
            display: "grid",
            gridAutoFlow: "column",
            gridAutoColumns: "minmax(180px, 220px)",
            gap: 16,
            overflowX: "auto",
            paddingBottom: 12,
          }}
        >
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/eventi/${event.slug}`}
              style={{
                textDecoration: "none",
                color: "#fff",
                borderRadius: 22,
                overflow: "hidden",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  aspectRatio: "3 / 4",
                  backgroundImage: `url('${event.poster_url && event.poster_url.startsWith("/") ? event.poster_url : "/cover-planet.jpg"}')`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              />

              <div style={{ padding: 14 }}>
                <div
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    borderRadius: 999,
                    border:
                      event.access_mode === "free"
                        ? "1px solid rgba(125,211,252,0.4)"
                        : event.access_mode === "paid"
                          ? "1px solid rgba(252,211,77,0.4)"
                          : "1px solid rgba(196,181,253,0.4)",
                    background:
                      event.access_mode === "free"
                        ? "rgba(125,211,252,0.08)"
                        : event.access_mode === "paid"
                          ? "rgba(252,211,77,0.08)"
                          : "rgba(196,181,253,0.08)",
                    color:
                      event.access_mode === "free"
                        ? "#7dd3fc"
                        : event.access_mode === "paid"
                          ? "#fcd34d"
                          : "#c4b5fd",
                    marginBottom: 10,
                    fontSize: 11,
                    textTransform: "uppercase",
                    opacity: 0.95,
                  }}
                >
                  {event.access_mode === "free"
                    ? "Gratuito"
                    : event.access_mode === "paid"
                      ? "A pagamento"
                      : "Paga all’ingresso"}
                </div>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    marginBottom: 6,
                  }}
                >
                  {event.title}
                </div>

                <div style={{ opacity: 0.72, fontSize: 14 }}>
                  {event.location?.split(",")[0] || "Location"}
                </div>

                <div style={{ opacity: 0.6, fontSize: 13, marginTop: 6 }}>
                  {formatCardDate(event.starts_at)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            padding: 18,
            background: "rgba(255,255,255,0.03)",
            opacity: 0.72,
          }}
        >
          Nessun evento da mostrare.
        </div>
      )}
    </section>
  );
}