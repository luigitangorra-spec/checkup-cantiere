import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin, prospectsTable } from "@/lib/supabase";

export const runtime = "nodejs";

function isAuthorized(token: string | null) {
  return token === (process.env.ADMIN_TOKEN || "admin-edilizia");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (!isAuthorized(searchParams.get("token"))) {
    return NextResponse.json({ error: "Token admin non valido" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from(prospectsTable())
    .select("*")
    .order("score", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

const UpdateSchema = z.object({
  token: z.string(),
  id: z.string().uuid(),
  status: z.enum(["new", "approved", "discarded", "contacted"])
});

export async function PATCH(request: Request) {
  try {
    const input = UpdateSchema.parse(await request.json());
    if (!isAuthorized(input.token)) {
      return NextResponse.json({ error: "Token admin non valido" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configurato" }, { status: 503 });
    }

    const { data, error } = await supabase
      .from(prospectsTable())
      .update({ status: input.status, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
