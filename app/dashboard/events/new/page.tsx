import EventForm from "@/components/dashboard/events/event-form";
import { createEventAction } from "../actions";

export default function NewEventPage() {
  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Crea evento</h1>
      <EventForm action={createEventAction} submitLabel="Crea evento" />
    </main>
  );
}