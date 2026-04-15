"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SuccessPageClient() {
  const params = useSearchParams();
  const [message, setMessage] = useState("Stiamo preparando il tuo ticket...");
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const session_id = params.get("session_id");

    if (!session_id) {
      setMessage("Sessione mancante.");
      return;
    }

    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev >= 92 ? prev : prev + 8));
    }, 250);

    const run = async () => {
      try {
        const res = await fetch(
          `/api/from-checkout?session_id=${encodeURIComponent(session_id)}`
        );
        const text = await res.text();

        if (!res.ok) {
          setMessage(`Errore API: ${text}`);
          clearInterval(progressTimer);
          return;
        }

        const data = JSON.parse(text);

        if (!data?.code) {
          setMessage("Ticket non trovato.");
          clearInterval(progressTimer);
          return;
        }

        clearInterval(progressTimer);
        setProgress(100);
        window.location.href = `/ticket/${data.code}`;
      } catch {
        clearInterval(progressTimer);
        setMessage("Errore durante il reindirizzamento.");
      }
    };

    run();

    return () => clearInterval(progressTimer);
  }, [params]);

  return (
    <main
      style={{
        minHeight: "100svh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "#050505",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 24,
          padding: 24,
          background: "rgba(255,255,255,.04)",
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <Image src="/logo.png" alt="Logo" width={160} height={44} />
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>
          Pagamento completato
        </h1>

        <p style={{ opacity: 0.8, marginTop: 12 }}>{message}</p>

        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: "rgba(255,255,255,.08)",
            overflow: "hidden",
            marginTop: 20,
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "#fff",
              transition: "width .25s ease",
            }}
          />
        </div>
      </div>
    </main>
  );
}