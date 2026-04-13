"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Success() {
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

        setProgress(100);
        setMessage("Pagamento ricevuto. Reindirizzamento al ticket...");

        setTimeout(() => {
          window.location.href = `/ticket/${data.code}`;
        }, 500);
      } catch {
        setMessage("Errore durante il reindirizzamento.");
        clearInterval(progressTimer);
      }
    };

    run();

    return () => clearInterval(progressTimer);
  }, [params]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#030303",
        color: "#fff",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 28,
          background: "rgba(12,12,16,0.82)",
          backdropFilter: "blur(14px)",
          padding: "28px 22px",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <Image
            src="/logo.png"
            alt="Simbiosi"
            width={180}
            height={60}
            priority
          />
        </div>

        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            margin: "0 auto 18px",
            border: "3px solid rgba(255,255,255,0.08)",
            borderTopColor: "#fff",
            animation: "spin 1s linear infinite",
          }}
        />

        <h1
          style={{
            margin: "0 0 10px",
            fontSize: 30,
            lineHeight: 1.05,
            textTransform: "uppercase",
          }}
        >
          Pagamento
          <br />
          ricevuto
        </h1>

        <p
          style={{
            margin: "0 0 18px",
            opacity: 0.8,
            lineHeight: 1.45,
            fontSize: 15,
          }}
        >
          {message}
        </p>

        <div
          style={{
            width: "100%",
            height: 10,
            borderRadius: 999,
            background: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              borderRadius: 999,
              background: "#fff",
              transition: "width 0.25s ease",
            }}
          />
        </div>

        <p style={{ marginTop: 12, opacity: 0.55, fontSize: 13 }}>
          Non chiudere questa pagina.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}