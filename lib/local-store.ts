import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import type { LeadRecord } from "./supabase";

const outboxDir = path.join(process.cwd(), "outbox");
const reportsDir = path.join(outboxDir, "reports");
const leadsFile = path.join(outboxDir, "leads.json");

async function ensureOutbox() {
  await mkdir(reportsDir, { recursive: true });
}

export async function saveLocalReport(id: string, pdf: Buffer) {
  await ensureOutbox();
  await writeFile(path.join(reportsDir, `${id}.pdf`), pdf);
}

export async function readLocalReport(id: string) {
  const file = path.join(reportsDir, `${id}.pdf`);
  if (!existsSync(file)) {
    return null;
  }

  return readFile(file);
}

export async function saveLocalLead(lead: LeadRecord) {
  await ensureOutbox();
  const leads = await readLocalLeads();
  leads.unshift({ ...lead, created_at: lead.created_at || new Date().toISOString() });
  await writeFile(leadsFile, JSON.stringify(leads, null, 2));
}

export async function updateLocalLeadEmailStatus(id: string, emailStatus: string) {
  const leads = await readLocalLeads();
  const next = leads.map((lead) => (lead.id === id ? { ...lead, email_status: emailStatus } : lead));
  await ensureOutbox();
  await writeFile(leadsFile, JSON.stringify(next, null, 2));
}

export async function readLocalLeads() {
  if (!existsSync(leadsFile)) {
    return [] as LeadRecord[];
  }

  const raw = await readFile(leadsFile, "utf8");
  return JSON.parse(raw) as LeadRecord[];
}
