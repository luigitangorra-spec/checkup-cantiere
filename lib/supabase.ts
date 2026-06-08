import { createClient } from "@supabase/supabase-js";

export type LeadRecord = {
  id: string;
  created_at?: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  score: number;
  level: string;
  answers: unknown;
  report_filename: string;
  email_status: string;
};

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function leadsTable() {
  return process.env.SUPABASE_LEADS_TABLE || "leads";
}

export function prospectsTable() {
  return process.env.SUPABASE_PROSPECTS_TABLE || "prospects";
}
