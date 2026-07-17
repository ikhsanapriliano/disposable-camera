import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const eventId = formData.get("event_id") as string;
    const sessionId = formData.get("session_id") as string;

    if (!file || !eventId || !sessionId) {
      return NextResponse.json(
        { error: "file, event_id, dan session_id wajib diisi" },
        { status: 400 }
      );
    }

    const sb = getSupabaseAdmin();
    const fileName = `${Date.now()}.jpg`;
    const filePath = `events/${eventId}/${sessionId}/${fileName}`;

    const { error: uploadErr } = await sb.storage
      .from("photos")
      .upload(filePath, file, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadErr) throw uploadErr;

    const { data: urlData } = sb.storage
      .from("photos")
      .getPublicUrl(filePath);

    const { data, error } = await sb
      .from("photos")
      .insert({
        event_id: eventId,
        url_foto: urlData.publicUrl,
        guest_session_id: sessionId,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}