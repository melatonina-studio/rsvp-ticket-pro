export function formatEventDate(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(value));
}

export function formatEventTime(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ticketStatusLabel(
  type: string,
  status: string,
  paymentStatus: string,
  startsAt?: string | null
) {
  const isPast = startsAt ? new Date(startsAt).getTime() < Date.now() : false;

  if (status === "used") return "Usato";
  if (status === "cancelled") return "Annullato";
  if (paymentStatus === "refunded") return "Rimborsato";

  if (isPast && status !== "active") {
    return "Concluso";
  }

  if (status === "active") {
    if (type === "paid") return "Attivo · Pagato";
    if (type === "door") return "Attivo · Da pagare";
    if (type === "free") return "Attivo · Gratuito";
  }

  if (isPast) return "Concluso";

  return "Attivo";
}

export function ticketStatusTone(
  type: string,
  status: string,
  paymentStatus: string,
  startsAt?: string | null
) {
  const isPast = startsAt ? new Date(startsAt).getTime() < Date.now() : false;

  if (status === "cancelled" || paymentStatus === "refunded") {
    return {
      border: "rgba(255,90,90,0.35)",
      background: "rgba(255,90,90,0.10)",
      color: "#ffb3b3",
    };
  }

  if (type === "door" && status === "used" && paymentStatus === "paid") {
    return {
      border: "rgba(80,220,140,0.35)",
      background: "rgba(80,220,140,0.12)",
      color: "#b8ffd3",
    };
  }

  if (status === "used" || isPast) {
    return {
      border: "rgba(255,255,255,0.14)",
      background: "rgba(255,255,255,0.05)",
      color: "rgba(255,255,255,0.86)",
    };
  }

  if (status === "active") {
    if (type === "paid" && paymentStatus === "paid") {
      return {
        border: "rgba(80,220,140,0.35)",
        background: "rgba(80,220,140,0.12)",
        color: "#b8ffd3",
      };
    }

    if (type === "door" && paymentStatus === "pending") {
      return {
        border: "rgba(255,200,90,0.35)",
        background: "rgba(255,200,90,0.12)",
        color: "#ffe1a3",
      };
    }

    if (type === "free" && paymentStatus === "free") {
      return {
        border: "rgba(90,170,255,0.35)",
        background: "rgba(90,170,255,0.12)",
        color: "#b8dcff",
      };
    }
  }

  return {
    border: "rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.05)",
    color: "rgba(255,255,255,0.86)",
  };
}