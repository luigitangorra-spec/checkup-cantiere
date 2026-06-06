type SendReportEmailInput = {
  to: string;
  name: string;
  company: string;
  score: number;
  level: string;
  pdf: Buffer;
  consultationUrl: string;
};

type BrevoFollowupInput = {
  email: string;
  name: string;
  phone: string;
};

function normalizeItalianPhone(phone: string) {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.startsWith("00")) {
    return `+${digits.slice(2)}`;
  }

  if (digits.startsWith("39") && digits.length > 10) {
    return `+${digits}`;
  }

  return `+39${digits}`;
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ")
  };
}

export async function sendReportEmail(input: SendReportEmailInput) {
  const provider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
  const from = process.env.EMAIL_FROM || "report@checkupcantiere.it";
  const signatureName = process.env.EMAIL_SIGNATURE_NAME || "";
  const signatureRole = process.env.EMAIL_SIGNATURE_ROLE || "";
  const signatureCompany = process.env.EMAIL_SIGNATURE_COMPANY || "Checkup Cantiere";
  const signaturePhone = process.env.EMAIL_SIGNATURE_PHONE || "";
  const subject = `Report di Analisi Cantieri - ${input.company}`;
  const text = [
    `Gentile ${input.name},`,
    "",
    "come concordato, ti invio in allegato il Report di Analisi relativo ai processi di gestione dei cantieri della tua azienda.",
    "",
    "Dall'analisi emergono alcune aree che potrebbero essere ulteriormente ottimizzate per migliorare:",
    "",
    "- controllo operativo dei cantieri",
    "- raccolta e condivisione delle informazioni",
    "- monitoraggio dei costi",
    "- gestione documentale",
    "- avanzamento lavori e SAL",
    "",
    `Livello rilevato: ${input.level}`,
    `Score: ${input.score}/100`,
    "",
    "Ti consiglio di dedicare qualche minuto alla lettura del report per comprendere le opportunita di miglioramento individuate.",
    "",
    "Se desideri approfondire i risultati e valutare possibili interventi organizzativi e digitali, puoi prenotare direttamente un appuntamento al seguente link:",
    "",
    input.consultationUrl,
    "",
    "Durante l'incontro analizzeremo nel dettaglio le criticita emerse e le possibili azioni per aumentare efficienza, controllo e marginalita dei cantieri.",
    "",
    "Resto a disposizione.",
    "",
    "Cordiali saluti",
    "",
    signatureName,
    signatureRole,
    signatureCompany,
    signaturePhone
  ].filter((line) => line !== undefined).join("\n");

  if (provider === "brevo") {
    return sendWithBrevo({ from, subject, text, ...input });
  }

  return sendWithResend({ from, subject, text, ...input });
}

async function sendWithResend(input: SendReportEmailInput & { from: string; subject: string; text: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return "email_not_configured";
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: input.from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      attachments: [
        {
          filename: "digital-gap-report.pdf",
          content: input.pdf.toString("base64")
        }
      ]
    })
  });

  if (!response.ok) {
    return `resend_error_${response.status}`;
  }

  return "sent_resend";
}

async function sendWithBrevo(input: SendReportEmailInput & { from: string; subject: string; text: string }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return "email_not_configured";
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      sender: { email: input.from },
      to: [{ email: input.to, name: input.name }],
      subject: input.subject,
      textContent: input.text,
      attachment: [
        {
          name: "digital-gap-report.pdf",
          content: input.pdf.toString("base64")
        }
      ]
    })
  });

  if (!response.ok) {
    return `brevo_error_${response.status}`;
  }

  return "sent_brevo";
}

export async function addBrevoContactForFollowup(input: BrevoFollowupInput) {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const listId = Number(process.env.BREVO_FOLLOWUP_LIST_ID?.trim() || "0");
  const { firstName, lastName } = splitFullName(input.name);
  const sms = normalizeItalianPhone(input.phone);

  if (!apiKey) {
    return "followup_not_configured";
  }

  if (!Number.isInteger(listId) || listId <= 0) {
    return "followup_invalid_list_id";
  }

  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: input.email,
      updateEnabled: true,
      listIds: [listId],
      attributes: {
        NOME: firstName,
        COGNOME: lastName,
        SMS: sms
      }
    })
  });

  if (!response.ok) {
    let errorCode = "";

    try {
      const body = (await response.json()) as { code?: string };
      errorCode = body.code ? `_${body.code.replace(/[^a-z0-9_-]/gi, "")}` : "";
    } catch {
      // The HTTP status is enough when Brevo does not return JSON.
    }

    return `followup_brevo_error_${response.status}${errorCode}`;
  }

  return "followup_added_brevo";
}
