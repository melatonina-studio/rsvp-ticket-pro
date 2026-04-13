"use client";

type AccessMode = "free" | "paid" | "door";
type EventStatus = "draft" | "published";

type EventFormValues = {
  title?: string;
  slug?: string;
  description?: string | null;
  location?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  poster_url?: string | null;
  lineup_text?: string | null;
  playlist_1_url?: string | null;
  playlist_2_url?: string | null;
  access_mode?: AccessMode;
  status?: EventStatus;
  price_cents?: number | null;
  capacity?: number | null;
};

type Props = {
  action: (formData: FormData) => void;
  initialValues?: EventFormValues;
  submitLabel: string;
};

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}

export default function EventForm({
  action,
  initialValues,
  submitLabel,
}: Props) {
  const price =
    initialValues?.price_cents && initialValues.price_cents > 0
      ? String(initialValues.price_cents / 100)
      : "";

  return (
    <form action={action} className="space-y-6 max-w-4xl">
      <div>
        <label className="mb-1 block text-sm font-medium">Titolo</label>
        <input
          name="title"
          defaultValue={initialValues?.title ?? ""}
          required
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Slug</label>
        <input
          name="slug"
          defaultValue={initialValues?.slug ?? ""}
          required
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Descrizione</label>
        <textarea
          name="description"
          defaultValue={initialValues?.description ?? ""}
          className="min-h-[120px] w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Location</label>
        <input
          name="location"
          defaultValue={initialValues?.location ?? ""}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Data inizio</label>
          <input
            type="datetime-local"
            name="starts_at"
            defaultValue={toDatetimeLocal(initialValues?.starts_at)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Data fine</label>
          <input
            type="datetime-local"
            name="ends_at"
            defaultValue={toDatetimeLocal(initialValues?.ends_at)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Poster URL</label>
        <input
          name="poster_url"
          defaultValue={initialValues?.poster_url ?? ""}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Modalità</label>
          <select
            name="access_mode"
            defaultValue={initialValues?.access_mode ?? "free"}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="free">Gratuito</option>
            <option value="paid">A pagamento</option>
            <option value="door">Paga all’ingresso</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Stato</label>
          <select
            name="status"
            defaultValue={initialValues?.status ?? "draft"}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Prezzo (€)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            name="price"
            defaultValue={price}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Capienza</label>
        <input
          type="number"
          min="0"
          name="capacity"
          defaultValue={initialValues?.capacity ?? ""}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Lineup</label>
        <textarea
          name="lineup_text"
          defaultValue={initialValues?.lineup_text ?? ""}
          className="min-h-[140px] w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Playlist 1 URL</label>
        <input
          name="playlist_1_url"
          defaultValue={initialValues?.playlist_1_url ?? ""}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Playlist 2 URL</label>
        <input
          name="playlist_2_url"
          defaultValue={initialValues?.playlist_2_url ?? ""}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-black px-4 py-2 text-white"
      >
        {submitLabel}
      </button>
    </form>
  );
}