import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import QRCode from "qrcode";

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const sb = getSupabaseAdmin();
    const { data: event } = await sb
      .from("events")
      .select("link_token")
      .eq("id", params.token)
      .single();

    if (!event) {
      return NextResponse.json(
        { error: "Event tidak ditemukan" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const qrData = `${baseUrl}/${event.link_token}`;

    const svg = await QRCode.toString(qrData, {
      type: "svg",
      width: 240,
      margin: 1,
      color: { dark: "#1a1a1a", light: "#ffffff" },
    });

    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}