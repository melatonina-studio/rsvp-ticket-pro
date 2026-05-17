import EventForm from "@/components/dashboard/events/event-form";
import { createEventAction } from "../actions";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function errorMessage(error?: string) {
  if (error === "missing_title") return "Inserisci il titolo dell’evento.";
  if (error === "missing_starts_at") return "Inserisci la data di inizio evento.";
  return "";
}

export default async function NewEventPage({ searchParams }: Props) {
  const params = await searchParams;
  const message = errorMessage(params.error);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        {message ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            {message}
          </div>
        ) : null}

        <EventForm action={createEventAction} submitLabel="Crea evento" />
      </div>
    </main>
  );
}