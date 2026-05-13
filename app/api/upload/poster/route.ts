import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_ORG_ID } from "@/lib/org";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function getExtension(file: File) {
  if (file.type === "image/jpeg") return "jpg";
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function safeName(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File mancante." },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato non supportato. Usa JPG, PNG o WEBP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File troppo grande. Massimo 5MB." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServerClient();

    const extension = getExtension(file);
    const baseName = safeName(file.name || "poster");
    const fileName = `${Date.now()}-${baseName}.${extension}`;

    const filePath = `${ACTIVE_ORG_ID}/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("event-posters")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const { data } = supabase.storage
      .from("event-posters")
      .getPublicUrl(filePath);

    return NextResponse.json({
      ok: true,
      path: filePath,
      publicUrl: data.publicUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message ?? "Errore upload locandina.",
      },
      { status: 500 }
    );
  }
}