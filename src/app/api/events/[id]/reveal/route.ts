import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb
      .from("events")
      .update({ is_revealed: true })
      .eq("id", params.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}