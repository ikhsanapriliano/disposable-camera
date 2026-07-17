import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("events")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama_acara, tanggal_acara, waktu_reveal, link_token } = body;

    if (!nama_acara || !waktu_reveal || !link_token) {
      return NextResponse.json(
        { error: "nama_acara, waktu_reveal, dan link_token wajib diisi" },
        { status: 400 }
      );
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("events")
      .insert({
        nama_acara,
        tanggal_acara: tanggal_acara || null,
        waktu_reveal,
        link_token,
        is_revealed: false,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}