"use client";

import { useEffect, useMemo, useState } from "react";

type AccessMode = "free" | "paid" | "door";
type EventStatus = "draft" | "published";
type LineupKind = "LIVE" | "DJSET";

type EventFormValues = {
  title?: string;
  slug?: string;
  description?: string | null;
  location?: string | null;
  location_maps_url?: string | null;
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

type LineupRow = {
  kind: LineupKind;
  name: string;
};

function toDatetimeLocal(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function parseLineup(lineupText?: string | null): LineupRow[] {
  if (!lineupText?.trim()) {
    return [{ kind: "DJSET", name: "" }];
  }

  const rows = lineupText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.toUpperCase().startsWith("LIVE ")) {
        return { kind: "LIVE" as LineupKind, name: line.slice(5).trim() };
      }

      if (
        line.toUpperCase().startsWith("DJSET ") ||
        line.toUpperCase().startsWith("DJ SET ")
      ) {
        return {
          kind: "DJSET" as LineupKind,
          name: line.replace(/^DJ\s?SET\s+/i, "").trim(),
        };
      }

      return { kind: "DJSET" as LineupKind, name: line };
    });

  return rows.length ? rows : [{ kind: "DJSET", name: "" }];
}

function buildLineupText(rows: LineupRow[]) {
  return rows
    .filter((row) => row.name.trim())
    .map((row) => `${row.kind} ${row.name.trim()}`)
    .join("\n");
}

export default function EventForm({
  action,
  initialValues,
  submitLabel,
}: Props) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [slug, setSlug] = useState(initialValues?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(Boolean(initialValues?.slug));
  const [accessMode, setAccessMode] = useState<AccessMode>(
    initialValues?.access_mode ?? "free"
  );
  const [poster, setPoster] = useState(initialValues?.poster_url ?? "");

  const [lineupRows, setLineupRows] = useState<LineupRow[]>(
    parseLineup(initialValues?.lineup_text)
  );

  const [playlistRows, setPlaylistRows] = useState<string[]>([
    initialValues?.playlist_1_url ?? "",
    initialValues?.playlist_2_url ?? "",
  ]);

  const price = useMemo(() => {
    const cents = initialValues?.price_cents ?? 0;
    return cents > 0 ? String(cents / 100) : "";
  }, [initialValues?.price_cents]);

  useEffect(() => {
    if (!slugEdited) {
      setSlug(slugify(title));
    }
  }, [title, slugEdited]);

  const lineupText = useMemo(() => buildLineupText(lineupRows), [lineupRows]);

  const nonEmptyPlaylists = playlistRows.map((item) => item.trim()).filter(Boolean);
  const playlist1 = nonEmptyPlaylists[0] ?? "";
  const playlist2 = nonEmptyPlaylists[1] ?? "";

  return (
    <form action={action} className="max-w-4xl space-y-8">
      <div className="space-y-5 rounded-xl border p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_280px]">
          <div>
            <label className="mb-1 block text-sm font-medium">Titolo evento</label>
            <input
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Slug</label>
            <input
              name="slug"
              value={slug}
              onChange={(e) => {
                setSlugEdited(true);
                setSlug(slugify(e.target.value));
              }}
              className="w-full rounded-lg border px-3 py-2"
            />
            <p className="mt-1 text-xs text-neutral-500">Auto dal titolo.</p>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Descrizione</label>
          <textarea
            name="description"
            defaultValue={initialValues?.description ?? ""}
            className="min-h-[120px] w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div className="space-y-5 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Location e data</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Nome location</label>
            <input
              name="location"
              defaultValue={initialValues?.location ?? ""}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">URL Google Maps</label>
            <input
              name="location_maps_url"
              defaultValue={initialValues?.location_maps_url ?? ""}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="https://maps.app.goo.gl/..."
            />
          </div>
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
      </div>

      <div className="space-y-5 rounded-xl border p-5">
        <h2 className="text-sm font-semibold">Locandina e accesso</h2>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_380px]">
          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium">Locandina</label>
              <input
                name="poster_url"
                value={poster}
                onChange={(e) => setPoster(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="/cover-planet.jpg"
              />
              <p className="mt-1 text-xs text-neutral-500">
                Per ora inseriamo il percorso immagine. Poi colleghiamo il selettore immagini.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_1fr_180px_120px]">
              <div>
                <label className="mb-1 block text-sm font-medium">Modalità</label>
                <select
                  name="access_mode"
                  value={accessMode}
                  onChange={(e) => setAccessMode(e.target.value as AccessMode)}
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
                  disabled={accessMode === "free"}
                  className="w-full rounded-lg border px-3 py-2 disabled:bg-neutral-100 disabled:text-neutral-400"
                />
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
            </div>
          </div>

          <div>
            {poster ? (
              <img
                src={poster}
                alt="Preview locandina"
                className="h-[420px] w-full rounded-xl border object-cover"
              />
            ) : (
              <div className="flex h-[420px] w-full items-center justify-center rounded-xl border border-dashed text-sm text-neutral-400">
                Anteprima locandina
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-5 rounded-xl border p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Lineup</h2>
          <button
            type="button"
            onClick={() =>
              setLineupRows((prev) => [...prev, { kind: "DJSET", name: "" }])
            }
            className="rounded border px-3 py-1 text-sm"
          >
            + Aggiungi riga
          </button>
        </div>

        <div className="space-y-3">
          {lineupRows.map((row, index) => (
            <div
              key={index}
              className="grid gap-3 md:grid-cols-[160px_1fr_110px]"
            >
              <select
                value={row.kind}
                onChange={(e) => {
                  const value = e.target.value as LineupKind;
                  setLineupRows((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, kind: value } : item
                    )
                  );
                }}
                className="rounded-lg border px-3 py-2"
              >
                <option value="LIVE">LIVE</option>
                <option value="DJSET">DJSET</option>
              </select>

              <input
                value={row.name}
                onChange={(e) => {
                  const value = e.target.value;
                  setLineupRows((prev) =>
                    prev.map((item, i) =>
                      i === index ? { ...item, name: value } : item
                    )
                  );
                }}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="Nome artista"
              />

              <button
                type="button"
                onClick={() =>
                  setLineupRows((prev) =>
                    prev.length === 1
                      ? [{ kind: "DJSET", name: "" }]
                      : prev.filter((_, i) => i !== index)
                  )
                }
                className="rounded border px-3 py-2"
              >
                Rimuovi
              </button>
            </div>
          ))}
        </div>

        <input type="hidden" name="lineup_text" value={lineupText} />
      </div>

      <div className="space-y-5 rounded-xl border p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold">Playlist</h2>
          <button
            type="button"
            onClick={() => setPlaylistRows((prev) => [...prev, ""])}
            className="rounded border px-3 py-1 text-sm"
          >
            + Aggiungi riga
          </button>
        </div>

        <div className="space-y-3">
          {playlistRows.map((row, index) => (
            <div key={index} className="grid gap-3 md:grid-cols-[1fr_110px]">
              <input
                value={row}
                onChange={(e) => {
                  const value = e.target.value;
                  setPlaylistRows((prev) =>
                    prev.map((item, i) => (i === index ? value : item))
                  );
                }}
                className="w-full rounded-lg border px-3 py-2"
                placeholder="URL playlist"
              />

              <button
                type="button"
                onClick={() =>
                  setPlaylistRows((prev) =>
                    prev.length === 1 ? [""] : prev.filter((_, i) => i !== index)
                  )
                }
                className="rounded border px-3 py-2"
              >
                Rimuovi
              </button>
            </div>
          ))}
        </div>

        <input type="hidden" name="playlist_1_url" value={playlist1} />
        <input type="hidden" name="playlist_2_url" value={playlist2} />

        <p className="text-xs text-neutral-500">
          Per ora vengono salvate solo le prime 2 playlist non vuote.
        </p>
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