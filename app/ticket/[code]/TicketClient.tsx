"use client";

import Image from "next/image";
import { useMemo, useEffect, useState } from "react";
import styles from "../ticket.module.css";
import {
  formatEventDate,
  formatEventTime,
  ticketStatusLabel,
  ticketStatusTone,
} from "@/lib/utils/format";

type TicketClientProps = {
  ticket: {
    code: string;
    qr_value: string;
    type: string;
    status: string;
    payment_status: string;
  };
  profile: {
    name: string;
    email: string;
    phone: string;
    pass_token: string;
  };
  event: {
    title: string;
    description: string;
    location: string;
    starts_at: string;
    price_cents: number | null;
    poster_url: string;
    lineup_text: string;
    playlist_1_url: string;
    playlist_2_url: string;
  };
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getLeft(targetMs: number) {
  const diff = targetMs - Date.now();
  if (diff <= 0) {
    return { done: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const s = Math.floor(diff / 1000);

  return {
    done: false,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

function getLineupItems(lineupText: string) {
  return lineupText
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const upper = row.toUpperCase();

      if (upper.startsWith("LIVE ")) {
        return { label: "LIVE", name: row.slice(5).trim() };
      }

      if (upper.startsWith("DJSET ")) {
        return { label: "DJSET", name: row.slice(6).trim() };
      }

      if (upper.startsWith("DJ SET ")) {
        return { label: "DJSET", name: row.slice(7).trim() };
      }

      return { label: "LIVE", name: row };
    });
}

export default function TicketClient({ ticket, profile, event }: TicketClientProps) {
  const eventTime = useMemo(() => new Date(event.starts_at).getTime(), [event.starts_at]);
  const [mounted, setMounted] = useState(false);
  const [left, setLeft] = useState({ done: false, days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
  setMounted(true);
  setLeft(getLeft(eventTime));

  const id = setInterval(() => {
    setLeft(getLeft(eventTime));
  }, 1000);

  return () => clearInterval(id);
}, [eventTime]);

  const qrPayload = ticket.qr_value || ticket.code || "MISSING";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrPayload)}`;

  const isPaid = ticket.type === "paid" || ticket.payment_status === "paid";

  const subtitle = isPaid
    ? "Pagamento ricevuto. Il tuo ticket è confermato. Mostralo all’ingresso."
    : "Sei dentro. Ti abbiamo aggiunto alla lista e pagherai il prezzo ridotto all’ingresso. Controlla la tua email di conferma.";

  const isDoor = ticket.type === "door";

const ticketLabel =
  ticket.payment_status === "paid" && isDoor
    ? event.price_cents
      ? `€${(event.price_cents / 100).toFixed(0)} pagato all’ingresso`
      : "Pagato all’ingresso"

    : ticket.payment_status === "paid"
    ? event.price_cents
      ? `€${(event.price_cents / 100).toFixed(0)} pagato`
      : "Pagato"

    : isDoor
    ? event.price_cents
      ? `€${(event.price_cents / 100).toFixed(0)} all’ingresso`
      : "Da pagare all’ingresso"

    : event.price_cents
    ? `€${(event.price_cents / 100).toFixed(0)}`
    : "Ingresso gratuito";

  const lineup = getLineupItems(event.lineup_text);

  const statusTone = ticketStatusTone(
    ticket.type,
    ticket.status,
    ticket.payment_status,
    event.starts_at
  );
  return (
    <main className={styles.main}>
      <div className={styles.shell}>
        <section className={styles.right}>
          <div
            style={{
                marginBottom: 18,
                padding: "4px 2px 0",
            }}
            >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "7px 12px",
                borderRadius: 999,
                border: `1px solid ${statusTone.border}`,
                background: statusTone.background,
                color: statusTone.color,
                fontSize: 12,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                opacity: 0.95,
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: statusTone.color,
                  display: "inline-block",
                  boxShadow: `0 0 10px ${statusTone.color}`,
                }}
              />
              <span>
                {ticketStatusLabel(
                  ticket.type,
                  ticket.status,
                  ticket.payment_status,
                  event.starts_at
                )}
              </span>
            </div>
                <p
                style={{
                    margin: "0 0 10px",
                    opacity: 0.58,
                    fontSize: 12,
                    textTransform: "uppercase",
                    letterSpacing: 1.2,
                }}
                >
                Trasmissione ricevuta
                </p>
            <h1
                style={{
                margin: "0 0 8px",
                fontSize: 34,
                lineHeight: 0.98,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                }}
            >
                {event.title}
            </h1>

            <div
                style={{
                marginBottom: 10,
                opacity: 0.9,
                fontSize: 15,
                lineHeight: 1.45,
                }}
            >
                {subtitle}
            </div>

            <div
                style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                alignItems: "center",
                opacity: 0.8,
                fontSize: 14,
                }}
            >
                <strong style={{ fontSize: 15 }}>{profile.name || "Partecipante"}</strong>
                {profile.email ? <span>· {profile.email}</span> : null}
            </div>
            </div>
            
          <div className={styles.posterWrap}>
            
            <Image
              src={event.poster_url || "/cover-planet.jpg"}
              alt={event.title || "Locandina evento"}
              fill
              priority
              className={styles.poster}
            />
          </div>

          <div className={styles.countdownCard}>
            <div className={styles.sectionLabel}>COUNTDOWN</div>
            <div className={styles.countdown}>
              <div className={styles.timeNum}>{mounted ? left.days : "0"}</div>
              <div className={styles.timeNum}>{mounted ? pad(left.hours) : "00"}</div>
              <div className={styles.timeNum}>{mounted ? pad(left.minutes) : "00"}</div>
              <div className={styles.timeNum}>{mounted ? pad(left.seconds) : "00"}</div>
            </div>
          </div>

          <div className={styles.qrCard}>
            <div className={styles.sectionLabel}>QR INGRESSO</div>

            <div className={styles.qrGrid}>
              <div className={styles.qrBox}>
                <img className={styles.qrImg} src={qrUrl} alt="QR ingresso" />
              </div>

              <div className={styles.qrMeta}>
                <div className={styles.ticketRow}>
                  <span className={styles.k}>Ticket</span>
                  <span className={styles.ticket}>{ticket.code || "—"}</span>
                </div>

                <div className={styles.ticketRow} style={{ marginTop: 8 }}>
                  <span className={styles.k}>Stato</span>
                  <span className={styles.ticket}>
                    {ticketStatusLabel(
  ticket.type,
  ticket.status,
  ticket.payment_status,
  event.starts_at
)}
                  </span>
                </div>

                <p className={styles.qrHint}>
                  Fai uno screenshot e mostralo all’ingresso.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.k}>Ticket</span>
              <span className={styles.v}>{ticketLabel}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.k}>Data</span>
              <span className={styles.v}>{formatEventDate(event.starts_at)}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.k}>Orario</span>
              <span className={styles.v}>Start {formatEventTime(event.starts_at)}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.k}>Evento</span>
              <span className={styles.v}>{event.title}</span>
            </div>

            <div className={styles.lineup}>
              <div className={styles.k}>Line up</div>
              <ul className={styles.list}>
                {lineup.length ? (
                  lineup.map((item, index) => (
                    <li key={`${item.name}-${index}`}>
                      <span className={styles.live}>{item.label}</span>
                      {item.name}
                    </li>
                  ))
                ) : (
                  <li>
                    <span className={styles.live}>LIVE</span>
                    Line up da definire
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className={styles.radarCard}>
            <div className={styles.radarHeader}>
              <div className={styles.place}>
                {event.location?.split(",")[0] || "LOCATION"}
              </div>

              <a
                className={styles.mapBtn}
                href="https://maps.google.com"
                target="_blank"
                rel="noreferrer"
              >
                Apri mappa
              </a>
            </div>

            <div className={styles.radar}>
              <div className={styles.radarSweep} />
              <div className={styles.radarGrid} />
              <div className={styles.radarDotWrap}>
                <div className={styles.radarDot} />
                <div className={styles.radarLabel}>
                  {event.location?.split(",")[0] || "LOCATION"}
                </div>
              </div>
              <div className={styles.radarDot2} />
            </div>
          </div>

          <div className={styles.actions}>
            <a
              className={styles.btn}
              href={event.playlist_1_url || "#"}
              target="_blank"
              rel="noreferrer"
            >
              Playlist 01
            </a>

            <a
              className={styles.btn}
              href={event.playlist_2_url || "#"}
              target="_blank"
              rel="noreferrer"
            >
              Playlist 02
            </a>
          </div>
        </section>
        <section className={styles.right}>
          <div className={styles.actions}>
                  <a
                    className={styles.btn}
                    href={`/pass/${profile.pass_token}`}
                  >
                    Ritorna profilo
                  </a>
          </div>
        </section>
      </div>
    </main>
  );
}