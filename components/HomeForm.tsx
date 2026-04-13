"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./HomeForm.module.css";

type EventData = {
  id: string;
  title: string;
  slug: string;
  description: string;
  location: string;
  starts_at: string;
  price_cents: number | null;
  access_mode: "free" | "paid" | "door";
};

type HomeFormProps = {
  event: EventData | null;
  compact?: boolean;
};

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export default function HomeForm({ event, compact = false }: HomeFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const accessMode = event?.access_mode ?? "free";
  const isPaid = accessMode === "paid";
  const isDoor = accessMode === "door";

  const ctaLabel = isPaid
    ? "Compra Ticket"
    : isDoor
      ? "Entra in lista"
      : "Partecipa gratis";

  const introText = isPaid
    ? "Inserisci nome, email e numero. Dopo il pagamento riceverai il tuo ticket digitale."
    : isDoor
      ? "Inserisci nome, email e numero. Riceverai il ticket lista e pagherai all’ingresso."
      : "Inserisci nome, email e numero. Riceverai il ticket gratuito per l’evento.";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);
    setEmailError(null);
    setNameError(null);
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      website: String(fd.get("website") || "").trim(),
      event_slug: event?.slug || "",
    };

    if (payload.name.length < 2) {
      const msg = "Inserisci un nome valido.";
      setNameError(msg);
      setError(msg);
      setLoading(false);
      return;
    }

    if (!isEmail(payload.email)) {
      const msg = "Inserisci un’email valida.";
      setEmailError(msg);
      setError(msg);
      setLoading(false);
      return;
    }

    try {
      if (isPaid) {
        const res = await fetch("/api/create-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.url) {
          setError(data?.error || "Errore apertura checkout");
          setLoading(false);
          return;
        }

        window.location.href = data.url;
        return;
      }

      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Errore RSVP");
        setLoading(false);
        return;
      }

      if (data?.code) {
        window.location.href = `/ticket/${data.code}`;
      } else {
        setError("Ticket non ricevuto");
      }

      setLoading(false);
    } catch {
      setError("Errore di rete. Riprova.");
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
          <input
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className={styles.honeypot}
          />

          <label className={styles.label}>
            <span className={styles.labelText}>Nome e Cognome</span>
            <input
              className={`${styles.input} ${nameError ? styles.inputInvalid : ""}`}
              name="name"
              required
              placeholder="Nome e cognome"
              autoComplete="name"
              onChange={() => {
                if (nameError) setNameError(null);
                if (error) setError(null);
              }}
            />
            {nameError && <div className={styles.fieldError}>{nameError}</div>}
          </label>

          <label className={styles.label}>
            <span className={styles.labelText}>Email</span>
            <input
              className={`${styles.input} ${emailError ? styles.inputInvalid : ""}`}
              name="email"
              required
              type="email"
              placeholder="nome@email.com"
              autoComplete="email"
              onChange={() => {
                if (emailError) setEmailError(null);
                if (error) setError(null);
              }}
            />
            {emailError && <div className={styles.fieldError}>{emailError}</div>}
          </label>

          <label className={styles.label}>
            <span className={styles.labelText}>Telefono (facoltativo)</span>
            <input
              className={styles.input}
              name="phone"
              type="tel"
              placeholder="+39 333 1234567"
              autoComplete="tel"
              onChange={() => {
                if (error) setError(null);
              }}
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? "Invio..." : ctaLabel}
          </button>

          <p className={styles.privacy}>
            Inviando accetti che useremo i dati solo per la gestione dell’evento.
            Per richiedere la cancellazione dei dati scrivi a: simbiosievents@gmail.com
          </p>
        </form>
      );
    }