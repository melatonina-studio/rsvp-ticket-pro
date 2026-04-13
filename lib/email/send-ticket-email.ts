import { Resend } from "resend";

type TicketType = "free" | "door" | "paid";

type SendTicketEmailArgs = {
  to: string;
  profileName?: string | null;
  eventTitle: string;
  eventLocation?: string | null;
  eventStartsAt?: string | null;
  ticketCode: string;
  ticketType: TicketType;
  passToken: string;
};

const resend = new Resend(process.env.RESEND_API_KEY);

function formatEventDate(value: string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getSubject(ticketType: TicketType, eventTitle: string) {
  if (ticketType === "paid") return `Pagamento ricevuto — ${eventTitle}`;
  if (ticketType === "door") return `Sei in lista — ${eventTitle}`;
  return `Ticket confermato — ${eventTitle}`;
}

function getIntro(ticketType: TicketType) {
  if (ticketType === "paid") return "Il tuo pagamento è stato ricevuto. Il ticket digitale è pronto.";
  if (ticketType === "door") return "Sei in lista. Mostra il ticket all’ingresso e paga alla porta.";
  return "La tua registrazione è confermata. Questo evento è gratuito.";
}

export async function sendTicketEmail(args: SendTicketEmailArgs) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const from = process.env.EMAIL_FROM;

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY mancante");
  }

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_BASE_URL mancante");
  }

  if (!from) {
    throw new Error("EMAIL_FROM mancante");
  }

  const ticketUrl = `${baseUrl}/ticket/${encodeURIComponent(args.ticketCode)}`;
  const passUrl = `${baseUrl}/pass/${encodeURIComponent(args.passToken)}`;
  const subject = getSubject(args.ticketType, args.eventTitle);
  const intro = getIntro(args.ticketType);

  const html = `
    <div style="margin:0;padding:0;background:#030303;color:#ffffff;font-family:Arial,sans-serif;">
      <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
        <div style="margin-bottom:24px;">
          <div style="font-size:28px;font-weight:700;letter-spacing:0.04em;">SIMBIOSI</div>
        </div>
        <div style="background:#0b0b10;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:28px;">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.65;margin-bottom:12px;">
            Ticket digitale
          </div>

          <h1 style="margin:0 0 12px;font-size:32px;line-height:1.05;">
            ${args.eventTitle}
          </h1>

          <p style="margin:0 0 16px;font-size:16px;line-height:1.5;opacity:0.9;">
            ${intro}
          </p>

          ${
            args.profileName
              ? `<p style="margin:0 0 18px;font-size:15px;opacity:0.8;">Ciao ${args.profileName},</p>`
              : ""
          }

          <div style="margin:0 0 18px;font-size:15px;line-height:1.6;opacity:0.86;">
            <div><strong>Location:</strong> ${args.eventLocation || "Da definire"}</div>
            <div><strong>Data:</strong> ${formatEventDate(args.eventStartsAt)}</div>
            <div><strong>Codice ticket:</strong> ${args.ticketCode}</div>
          </div>

          <div style="display:flex;gap:12px;flex-wrap:wrap;margin:24px 0;">
            <a href="${ticketUrl}" style="display:inline-block;padding:14px 18px;border-radius:14px;background:#ffffff;color:#000000;text-decoration:none;font-weight:700;">
              Apri ticket
            </a>

            <a href="${passUrl}" style="display:inline-block;padding:14px 18px;border-radius:14px;background:#1a1a22;color:#ffffff;text-decoration:none;font-weight:700;border:1px solid rgba(255,255,255,0.1);">
              Apri profilo
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  const result = await resend.emails.send({
    from,
    to: [args.to],
    subject,
    html,
  });

  if ((result as any).error) {
    throw new Error((result as any).error.message || "Errore invio email");
  }

  return result;
}