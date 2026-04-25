"use client";

import { useEffect, useState } from "react";
import ScanClient from "../../components/ScanClient";

export default function ScanPage() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [missingEvent, setMissingEvent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = (params.get("key") || "").trim();
    const ev = (params.get("event") || "").trim();

    if (!ev) {
      setMissingEvent(true);
      setAllowed(false);
      return;
    }

    setEventId(ev);

    const expected = process.env.NEXT_PUBLIC_SCAN_KEY || "";
    setAllowed(!!expected && !!key && key === expected);
  }, []);

  if (allowed === null) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Scanner</h1>
        <p>Controllo accesso...</p>
      </main>
    );
  }

  if (missingEvent) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Scanner</h1>
        <p>Evento non specificato</p>
      </main>
    );
  }

  if (!allowed || !eventId) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Scanner</h1>
        <p>Accesso negato</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
      <h1>Scanner</h1>
      <p style={{ opacity: 0.8 }}>Scansiona il QR di questo evento.</p>
      <ScanClient eventId={eventId} />
    </main>
  );
}