import { NextResponse } from "next/server";
import { readLocalLeads, readLocalReport } from "@/lib/local-store";
import { createReportPdf } from "@/lib/pdf";
import { scoreProfile, type SelectedAnswers } from "@/lib/quiz";
import { getSupabaseAdmin, leadsTable } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const savedPdf = await readLocalReport(params.id);
    if (savedPdf) {
      return pdfResponse(savedPdf, params.id);
    }

    const lead = (await readLocalLeads()).find((item) => item.id === params.id);
    if (!lead) {
      return NextResponse.json({ error: "Report non trovato" }, { status: 404 });
    }

    const { summary } = scoreProfile(lead.score);
    const pdf = await createReportPdf(
      {
        name: lead.name,
        company: lead.company,
        email: lead.email,
        phone: lead.phone,
        score: lead.score,
        level: lead.level,
        summary
      },
      lead.answers as SelectedAnswers
    );
    return pdfResponse(pdf, params.id);
  }

  const { data, error } = await supabase
    .from(leadsTable())
    .select("name, company, email, phone, score, level, answers")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Report non trovato" }, { status: 404 });
  }

  const { summary } = scoreProfile(data.score);
  const pdf = await createReportPdf(
    {
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      score: data.score,
      level: data.level,
      summary
    },
    data.answers as SelectedAnswers
  );

  return pdfResponse(pdf, params.id);
}

function pdfResponse(pdf: Buffer | Uint8Array, id: string) {
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="digital-gap-report-${id}.pdf"`
    }
  });
}
