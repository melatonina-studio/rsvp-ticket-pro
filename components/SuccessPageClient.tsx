"use client";

import { useSearchParams } from "next/navigation";

export default function SuccessPageClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main style={{ padding: 24 }}>
      <h1>Pagamento completato</h1>
      <p>Session ID: {sessionId ?? "Nessuno"}</p>
    </main>
  );
}