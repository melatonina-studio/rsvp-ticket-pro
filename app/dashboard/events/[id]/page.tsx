import EventForm from "@/components/dashboard/events/event-form";
import { updateEventAction } from "../actions";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;
  const supabase = createSupabaseServerClient();

  const { data: event, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !event) {
    throw new Error(error?.message ?? "Evento non trovato");
  }

  const boundAction = updateEventAction.bind(null, id);

  return (
    <main className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Modifica evento</h1>

      <EventForm
        action={boundAction}
        initialValues={event}
        submitLabel="Salva modifiche"
      />
    </main>
  );
}