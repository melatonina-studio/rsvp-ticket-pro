"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AccessMode = "free" | "paid" | "door";
type EventStatus = "draft" | "published";

export async function updateEventRow(
  id: string,
  data: {
    access_mode: AccessMode;
    status: EventStatus;
  }
) {
  const supabase = createSupabaseServerClient();

  const patch: {
    access_mode: AccessMode;
    status: EventStatus;
    price_cents?: number;
  } = {
    access_mode: data.access_mode,
    status: data.status,
  };

  if (data.access_mode === "free") {
    patch.price_cents = 0;
  }

  const { error } = await supabase
    .from("events")
    .update(patch)
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/events");
}

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNullableString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value : null;
}

function normalizePrice(
  accessMode: AccessMode,
  rawPrice: FormDataEntryValue | null
) {
  if (accessMode === "free") return 0;

  const value = Number(rawPrice ?? 0);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Prezzo non valido");
  }

  return Math.round(value * 100);
}

function normalizeCapacity(rawValue: FormDataEntryValue | null) {
  const value = Number(rawValue ?? 0);

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Capienza non valida");
  }

  return Math.round(value);
}

export async function createEventAction(formData: FormData) {
  const supabase = createSupabaseServerClient();

  const title = getString(formData, "title");
  const slug = getString(formData, "slug");
  const description = getNullableString(formData, "description");
  const location = getNullableString(formData, "location");
  const location_maps_url = getNullableString(formData, "location_maps_url");
  const starts_at = getNullableString(formData, "starts_at");
  const ends_at = getNullableString(formData, "ends_at");
  const poster_url = getNullableString(formData, "poster_url");
  const lineup_text = getNullableString(formData, "lineup_text");
  const playlist_1_url = getNullableString(formData, "playlist_1_url");
  const playlist_2_url = getNullableString(formData, "playlist_2_url");

  const access_mode = getString(formData, "access_mode") as AccessMode;
  const status = getString(formData, "status") as EventStatus;

  if (!title) throw new Error("Titolo obbligatorio");
  if (!slug) throw new Error("Slug obbligatorio");

  const price_cents = normalizePrice(access_mode, formData.get("price"));
  const capacity = normalizeCapacity(formData.get("capacity"));

  const { error } = await supabase
    .from("events")
    .insert({
      title,
      slug,
      description,
      location,
      location_maps_url,
      starts_at,
      ends_at,
      poster_url,
      lineup_text,
      playlist_1_url,
      playlist_2_url,
      access_mode,
      status,
      price_cents,
      capacity,
    });

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/events");
  redirect("/dashboard/events");
}

export async function updateEventAction(id: string, formData: FormData) {
  const supabase = createSupabaseServerClient();

  const title = getString(formData, "title");
  const slug = getString(formData, "slug");
  const description = getNullableString(formData, "description");
  const location = getNullableString(formData, "location");
  const location_maps_url = getNullableString(formData, "location_maps_url");;
  const starts_at = getNullableString(formData, "starts_at");
  const ends_at = getNullableString(formData, "ends_at");
  const poster_url = getNullableString(formData, "poster_url");
  const lineup_text = getNullableString(formData, "lineup_text");
  const playlist_1_url = getNullableString(formData, "playlist_1_url");
  const playlist_2_url = getNullableString(formData, "playlist_2_url");

  const access_mode = getString(formData, "access_mode") as AccessMode;
  const status = getString(formData, "status") as EventStatus;

  if (!title) throw new Error("Titolo obbligatorio");
  if (!slug) throw new Error("Slug obbligatorio");

  const price_cents = normalizePrice(access_mode, formData.get("price"));
  const capacity = normalizeCapacity(formData.get("capacity"));

  const { error } = await supabase
    .from("events")
    .update({
      title,
      slug,
      description,
      location,
      location_maps_url,
      starts_at,
      ends_at,
      poster_url,
      lineup_text,
      playlist_1_url,
      playlist_2_url,
      access_mode,
      status,
      price_cents,
      capacity,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/events");
  revalidatePath(`/dashboard/events/${id}`);
  redirect("/dashboard/events");
}