import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("events")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sb = getSupabaseAdmin();

    const { data: photos } = await sb
      .from("photos")
      .select("url_foto")
      .eq("event_id", params.id);

    if (photos && photos.length > 0) {
      const paths = photos.map((p) => {
        const url = new URL(p.url_foto);
        return url.pathname.split("/").slice(2).join("/");
      });
      await sb.storage.from("photos").remove(paths);
    }

    await sb.from("photos").delete().eq("event_id", params.id);
    await sb.from("events").delete().eq("id", params.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}