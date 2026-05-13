"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";


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

const POSTER_OPTIONS = [
  { label: "Cover Planet", value: "/cover-planet.jpg" },
  { label: "Cover Planet 3", value: "/cover_planet_3.jpg" },
  { label: "Threshold", value: "/threshold.jpg" },
  { label: "BG", value: "/bg.jpg" },
];

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

function fieldClass() {
  return "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30";
}

function selectClass() {
  return "w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-white/30";
}

function sectionClass() {
  return "rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6";
}

function labelClass() {
  return "mb-2 block text-sm font-semibold text-white";
}

function helperClass() {
  return "mt-2 text-xs leading-relaxed text-neutral-500";
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

  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [posterUploadError, setPosterUploadError] = useState("");

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

  const nonEmptyPlaylists = playlistRows
    .map((item) => item.trim())
    .filter(Boolean);

  const playlist1 = nonEmptyPlaylists[0] ?? "";
  const playlist2 = nonEmptyPlaylists[1] ?? "";

  async function handlePosterUpload(file: File | null) {
  if (!file) return;

  setPosterUploadError("");
  setIsUploadingPoster(true);

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/poster", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Errore upload locandina");
    }

    setPoster(data.publicUrl);
  } catch (error: any) {
    setPosterUploadError(error?.message || "Errore upload locandina");
  } finally {
    setIsUploadingPoster(false);
  }
}

  return (
    <form action={action} className="max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
            Gestione evento
          </p>

          <h1 className="mt-2 text-3xl font-bold text-white">
            {initialValues?.title ? "Modifica evento" : "Crea evento"}
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-neutral-500">
            Configura pagina pubblica, modalità di accesso, locandina, lineup e
            playlist dell’evento.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {slug ? (
            <Link
              href={`/eventi/${slug}`}
              target="_blank"
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Apri evento
            </Link>
          ) : null}

          <button
            type="submit"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            {submitLabel}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <section className={sectionClass()}>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">
                Informazioni principali
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Titolo, slug e descrizione pubblica dell’evento.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
              <div>
                <label className={labelClass()}>Titolo evento</label>
                <input
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className={fieldClass()}
                  placeholder="Nome evento"
                />
              </div>

              <div>
                <label className={labelClass()}>Slug</label>
                <input
                  name="slug"
                  value={slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setSlug(slugify(e.target.value));
                  }}
                  className={fieldClass()}
                  placeholder="nome-evento"
                />
                <p className={helperClass()}>
                  Usato per la pagina pubblica: /eventi/{slug || "slug-evento"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <label className={labelClass()}>Descrizione</label>
              <textarea
                name="description"
                defaultValue={initialValues?.description ?? ""}
                className={`${fieldClass()} min-h-[150px] resize-y`}
                placeholder="Descrizione evento..."
              />
            </div>
          </section>

          <section className={sectionClass()}>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">
                Location e data
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Informazioni visibili nella pagina evento e nelle card.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className={labelClass()}>Nome location</label>
                <input
                  name="location"
                  defaultValue={initialValues?.location ?? ""}
                  className={fieldClass()}
                  placeholder="Nome location"
                />
              </div>

              <div>
                <label className={labelClass()}>URL Google Maps</label>
                <input
                  name="location_maps_url"
                  defaultValue={initialValues?.location_maps_url ?? ""}
                  className={fieldClass()}
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div>
                <label className={labelClass()}>Data inizio</label>
                <input
                  type="datetime-local"
                  name="starts_at"
                  defaultValue={toDatetimeLocal(initialValues?.starts_at)}
                  className={fieldClass()}
                />
              </div>

              <div>
                <label className={labelClass()}>Data fine</label>
                <input
                  type="datetime-local"
                  name="ends_at"
                  defaultValue={toDatetimeLocal(initialValues?.ends_at)}
                  className={fieldClass()}
                />
              </div>
            </div>
          </section>

          <section className={sectionClass()}>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">
                Accesso e capienza
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Gestisci modalità evento, pubblicazione, prezzo e posti.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className={labelClass()}>Modalità</label>
                <select
                  name="access_mode"
                  value={accessMode}
                  onChange={(e) => setAccessMode(e.target.value as AccessMode)}
                  className={selectClass()}
                >
                  <option value="free">Gratuito</option>
                  <option value="paid">A pagamento</option>
                  <option value="door">Paga all’ingresso</option>
                </select>
              </div>

              <div>
                <label className={labelClass()}>Stato</label>
                <select
                  name="status"
                  defaultValue={initialValues?.status ?? "draft"}
                  className={selectClass()}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div>
                <label className={labelClass()}>Prezzo (€)</label>

                {accessMode === "free" ? (
                  <input type="hidden" name="price" value="0" />
                ) : null}

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name={accessMode === "free" ? undefined : "price"}
                  defaultValue={price}
                  disabled={accessMode === "free"}
                  className={`${fieldClass()} disabled:cursor-not-allowed disabled:border-white/5 disabled:bg-white/5 disabled:text-neutral-500`}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={labelClass()}>Capienza</label>
                <input
                  type="number"
                  min="0"
                  name="capacity"
                  defaultValue={initialValues?.capacity ?? ""}
                  className={fieldClass()}
                  placeholder="500"
                />
              </div>
            </div>
          </section>

          <section className={sectionClass()}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Lineup</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Aggiungi artisti, live e DJ set.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setLineupRows((prev) => [
                    ...prev,
                    { kind: "DJSET", name: "" },
                  ])
                }
                className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                + Aggiungi riga
              </button>
            </div>

            <div className="space-y-3">
              {lineupRows.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-3 md:grid-cols-[150px_1fr_120px]"
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
                    className={selectClass()}
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
                    className={fieldClass()}
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
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Rimuovi
                  </button>
                </div>
              ))}
            </div>

            <input type="hidden" name="lineup_text" value={lineupText} />
          </section>

          <section className={sectionClass()}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-white">Playlist</h2>
                <p className="mt-1 text-sm text-neutral-500">
                  Inserisci link SoundCloud, Spotify o altre playlist.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPlaylistRows((prev) => [...prev, ""])}
                className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                + Aggiungi riga
              </button>
            </div>

            <div className="space-y-3">
              {playlistRows.map((row, index) => (
                <div
                  key={index}
                  className="grid gap-3 md:grid-cols-[1fr_120px]"
                >
                  <input
                    value={row}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPlaylistRows((prev) =>
                        prev.map((item, i) => (i === index ? value : item))
                      );
                    }}
                    className={fieldClass()}
                    placeholder="URL playlist"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setPlaylistRows((prev) =>
                        prev.length === 1
                          ? [""]
                          : prev.filter((_, i) => i !== index)
                      )
                    }
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Rimuovi
                  </button>
                </div>
              ))}
            </div>

            <input type="hidden" name="playlist_1_url" value={playlist1} />
            <input type="hidden" name="playlist_2_url" value={playlist2} />

            <p className={helperClass()}>
              Per ora vengono salvate solo le prime 2 playlist non vuote.
            </p>
          </section>
        </div>

        <aside className="space-y-6">
          <section className={`${sectionClass()} xl:sticky xl:top-6`}>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-white">
                Locandina
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Scegli una locandina già presente in public oppure inserisci il
                percorso manualmente.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className={labelClass()}>Carica locandina</label>

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handlePosterUpload(e.target.files?.[0] ?? null)}
                  className="block w-full cursor-pointer rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-neutral-300 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-black hover:file:bg-neutral-200"
                  disabled={isUploadingPoster}
                />

                <p className={helperClass()}>
                  Formati supportati: JPG, PNG, WEBP. Peso massimo: 5MB.
                </p>

                {isUploadingPoster ? (
                  <p className="mt-2 text-sm text-sky-300">Upload in corso...</p>
                ) : null}

                {posterUploadError ? (
                  <p className="mt-2 text-sm text-red-300">{posterUploadError}</p>
                ) : null}
              </div>

              <div>
                <label className={labelClass()}>URL locandina</label>

                <input
                  name="poster_url"
                  value={poster}
                  onChange={(e) => setPoster(e.target.value)}
                  className={fieldClass()}
                  placeholder="https://..."
                />

                <p className={helperClass()}>
                  Puoi caricare un file oppure incollare un URL manualmente.
                </p>
              </div>

              {poster ? (
                <img
                  src={poster}
                  alt="Preview locandina"
                  className="h-[520px] w-full rounded-2xl border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-[520px] w-full items-center justify-center rounded-2xl border border-dashed border-white/15 text-sm text-neutral-500">
                  Anteprima locandina
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-white/10 bg-black/80 px-4 py-4 backdrop-blur md:mx-0 md:rounded-2xl md:border md:bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-neutral-500">
            Salva le modifiche per aggiornare evento, ticket e pagina pubblica.
          </p>

          <button
            type="submit"
            className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}