import { NextResponse } from "next/server";
import { z } from "zod";
import { addBrevoContactForFollowup, sendReportEmail } from "@/lib/email";
import { saveLocalLead, saveLocalReport, updateLocalLeadEmailStatus } from "@/lib/local-store";
import { createReportPdf } from "@/lib/pdf";
import { buildAssessment, calculateScore, scoreProfile } from "@/lib/quiz";
import { getSupabaseAdmin, leadsTable } from "@/lib/supabase";

export const runtime = "nodejs";

const SubmitSchema = z.object({
  lead: z.object({
    name: z.string().min(1).max(160),
    company: z.string().min(1).max(160),
    email: z.string().email().max(160),
    phone: z.string().min(1).max(80)
  }),
  answers: z.record(z.coerce.number())
});

export async function POST(request: Request) {
  try {
    const payload = SubmitSchema.parse(await request.json());
    const id = crypto.randomUUID();
    const { score, answers } = calculateScore(payload.answers);
    const { level, summary } = scoreProfile(score);
    const assessment = buildAssessment(answers);
    const consultationUrl =
      process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/checkupcantiere/consulenza";
    const reportFilename = `digital-gap-report-${id}.pdf`;
    const pdf = await createReportPdf({ ...payload.lead, score, level, summary }, answers);

    const supabase = getSupabaseAdmin();
    const isVercel = Boolean(process.env.VERCEL);
    const leadRecord = {
      id,
      name: payload.lead.name,
      company: payload.lead.company,
      email: payload.lead.email,
      phone: payload.lead.phone,
      score,
      level,
      answers,
      report_filename: reportFilename,
      email_status: "pending"
    };

    if (supabase) {
      const { error } = await supabase.from(leadsTable()).insert(leadRecord);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (isVercel) {
      return NextResponse.json(
        {
          error:
            "Supabase non configurato su Vercel. Aggiungi SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY nelle Environment Variables e rifai il deploy."
        },
        { status: 500 }
      );
    } else {
      await saveLocalReport(id, pdf);
      await saveLocalLead(leadRecord);
    }

    let emailStatus = "email_error";
    try {
      emailStatus = await sendReportEmail({
        to: payload.lead.email,
        ...payload.lead,
        score,
        level,
        pdf,
        consultationUrl
      });
    } catch {
      emailStatus = "email_error";
    }

    let followupStatus = "followup_not_requested";
    if ((process.env.EMAIL_PROVIDER || "").toLowerCase() === "brevo") {
      try {
        followupStatus = await addBrevoContactForFollowup({
          email: payload.lead.email,
          name: payload.lead.name,
          phone: payload.lead.phone
        });
      } catch {
        followupStatus = "followup_error";
      }
    }

    const deliveryStatus = `${emailStatus} | ${followupStatus}`;

    if (supabase) {
      await supabase.from(leadsTable()).update({ email_status: deliveryStatus }).eq("id", id);
    } else {
      await updateLocalLeadEmailStatus(id, deliveryStatus);
    }

    return NextResponse.json(
      {
        id,
        score,
        level,
        summary,
        assessment,
        reportUrl: `/api/reports/${id}`,
        consultationUrl,
        emailStatus,
        followupStatus
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore interno";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
