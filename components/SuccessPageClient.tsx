"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function SuccessPageClient() {
  const params = useSearchParams();
  const [message, setMessage] = useState("Stiamo preparando il tuo ticket...");
  const [progress, setProgress] = useState(18);

  useEffect(() => {
    const sessionId = params.get("session_id");

    if (!sessionId) {
      setMessage("Sessione mancante.");
      return;
    }

    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev >= 92 ? prev : prev + 8));
    }, 250);

    const run = async () => {
      try {
        const res = await fetch(
          `/api/from-checkout?session_id=${encodeURIComponent(sessionId)}`
        );

        const text = await res.text();

        if (!res.ok) {
          clearInterval(progressTimer);
          setMessage(`Errore API: ${text}`);
          return;
        }

        const data = JSON.parse(text);

        if (!data?.code) {
          clearInterval(progressTimer);
          setMessage("Ticket non trovato.");
          return;
        }

        clearInterval(progressTimer);
        setProgress(100);

        setTimeout(() => {
          window.location.href = `/ticket/${data.code}`;
        }, 450);
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
        background:
          "radial-gradient(circle at top, rgba(255,255,255,.08), transparent 35%), #050505",
        color: "#fff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          border: "1px solid rgba(255,255,255,.12)",
          borderRadius: 28,
          padding: 28,
          background: "rgba(255,255,255,.04)",
          boxShadow: "0 20px 60px rgba(0,0,0,.38)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 22,
          }}
        >
          <Image src="/logo.png" alt="Logo" width={180} height={52} priority />
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "8px 14px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.12)",
            background: "rgba(255,255,255,.05)",
            fontSize: 13,
            marginBottom: 18,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#fff",
              display: "inline-block",
              opacity: 0.85,
            }}
          />
          Trasmissione ricevuta
        </div>

        <h1
          style={{
            fontSize: 34,
            lineHeight: 1.05,
            fontWeight: 900,
            margin: 0,
            letterSpacing: "-0.03em",
          }}
        >
          Pagamento completato
        </h1>

        <p
          style={{
            marginTop: 14,
            marginBottom: 0,
            fontSize: 16,
            lineHeight: 1.5,
            opacity: 0.84,
          }}
        >
          {message}
        </p>

        <div style={{ marginTop: 28 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 13,
              opacity: 0.7,
              marginBottom: 10,
            }}
          >
            <span>Preparazione ticket</span>
            <span>{progress}%</span>
          </div>

          <div
            style={{
              height: 12,
              borderRadius: 999,
              background: "rgba(255,255,255,.08)",
              overflow: "hidden",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,.25)",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                borderRadius: 999,
                background:
                  "linear-gradient(90deg, rgba(255,255,255,.72), rgba(255,255,255,1))",
                transition: "width .25s ease",
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}