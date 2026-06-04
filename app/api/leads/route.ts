import { NextResponse } from "next/server";
import { readLocalLeads } from "@/lib/local-store";
import { getSupabaseAdmin, leadsTable } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (token !== (process.env.ADMIN_TOKEN || "admin-edilizia")) {
    return NextResponse.json({ error: "Token admin non valido" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(await readLocalLeads());
  }

  const { data, error } = await supabase
    .from(leadsTable())
    .select("id, created_at, name, company, email, phone, score, level, email_status")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
