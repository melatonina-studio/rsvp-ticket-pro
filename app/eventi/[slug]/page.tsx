import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/PublicHeader";
import HomeForm from "@/components/HomeForm";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const supabase = createSupabaseServerClient();

  const { data: event, error } = await supabase
    .from("events")
    .select(`
      id,
      title,
      slug,
      description,
      location,
      starts_at,
      price_cents,
      status,
      access_mode,
      poster_url,
      lineup_text,
      playlist_1_url,
      playlist_2_url
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !event) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main style={{ position: "relative", minHeight: "100vh" }}>
      
      {/* 🎥 VIDEO BACKGROUND */}
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <source src="/bg.mp4" type="video/mp4" />
      </video>

      {/* 🌑 OVERLAY */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 80%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* 🎯 CONTENUTO CENTRATO */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "rgba(10,10,10,0.7)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            padding: 24,
          }}
        >
          {/* 🏷️ TAG */}
          <div
            style={{
              marginBottom: 10,
              fontSize: 11,
              textTransform: "uppercase",
              opacity: 0.7,
            }}
          >
            {event.access_mode === "free" && "Gratuito"}
            {event.access_mode === "paid" && "A pagamento"}
            {event.access_mode === "door" && "Pagamento all’ingresso"}
          </div>

          {/* 🧠 TITLE */}
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: 26,
              lineHeight: 1.1,
            }}
          >
            {event.title}
          </h1>

          {/* 📍 INFO */}
          <p style={{ opacity: 0.7, fontSize: 14 }}>
            {event.location}
          </p>

          {/* 🧾 FORM */}
          <HomeForm
            event={{
              id: event.id,
              title: event.title,
              slug: event.slug,
              description: event.description,
              location: event.location,
              starts_at: event.starts_at,
              price_cents: event.price_cents,
              access_mode: event.access_mode,
            }}
            compact
          />
        </div>
      </div>
    </main>
    </>
  );
}