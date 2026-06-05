type SendReportEmailInput = {
  to: string;
  name: string;
  company: string;
  score: number;
  level: string;
  pdf: Buffer;
  consultationUrl: string;
};

export async function sendReportEmail(input: SendReportEmailInput) {
  const provider = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
  const from = process.env.EMAIL_FROM || "report@checkupcantiere.it";
  const subject = `Report Checkup Cantiere - ${input.company}`;
  const text = [
    `Ciao ${input.name},`,
    "",
    "in allegato trovi il report personalizzato di Checkup Cantiere.",
    "",
    `Score: ${input.score}/100 - ${input.level}`,
    "Il report include criticita rilevate, aree di miglioramento e benefici stimati della digitalizzazione.",
    `Prenota una consulenza: ${input.consultationUrl}`,
    "",
    "A presto."
  ].join("\n");

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
    return "resend_error";
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
