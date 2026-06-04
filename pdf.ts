import { buildAssessment, questions, recommendations, type SelectedAnswers } from "./quiz";

type ReportLead = {
  name: string;
  company: string;
  email: string;
  phone: string;
  score: number;
  level: string;
  summary: string;
};

type PdfLine = {
  text: string;
  bold?: boolean;
};

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapLine(value: string, maxLength = 86) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function addWrappedLines(lines: PdfLine[], value: string, bold = false) {
  for (const line of wrapLine(value)) {
    lines.push({ text: line, bold });
  }
}

function createPdfStream(lines: PdfLine[]) {
  const commands = ["BT", "/F1 9 Tf", "45 800 Td"];
  let activeFont = "F1";

  lines.forEach((line, index) => {
    if (index > 0) {
      commands.push("0 -13 Td");
    }
    const nextFont = line.bold ? "F2" : "F1";
    if (nextFont !== activeFont) {
      commands.push(`/${nextFont} 9 Tf`);
      activeFont = nextFont;
    }
    commands.push(`(${escapePdfText(line.text)}) Tj`);
  });

  commands.push("ET");
  return commands.join("\n");
}

function createPageObject(contentObjectId: number) {
  return `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`;
}

function chunkLines(lines: PdfLine[], size = 58) {
  const pages: PdfLine[][] = [];
  for (let index = 0; index < lines.length; index += size) {
    pages.push(lines.slice(index, index + size));
  }
  return pages;
}

export async function createReportPdf(lead: ReportLead, answers: SelectedAnswers) {
  const assessment = buildAssessment(answers);
  const lines: PdfLine[] = [
    { text: "Checkup Cantiere - Report personalizzato", bold: true },
    { text: `Azienda: ${lead.company}` },
    { text: `Referente: ${lead.name}` },
    { text: `Email: ${lead.email}` },
    { text: `Telefono: ${lead.phone}` },
    { text: "" },
    { text: `Score digitale: ${lead.score}/100`, bold: true },
    { text: `Profilo: ${lead.level}`, bold: true },
    { text: "" },
    { text: "Sintesi operativa:", bold: true }
  ];

  addWrappedLines(lines, lead.summary);
  lines.push(
    { text: "" },
    {
      text:
        "Questa relazione evidenzia le criticita operative che richiedono intervento prioritario. Le aree indicate non sono semplici ottimizzazioni: se non presidiate, possono generare ritardi, extracosti, perdita di tracciabilita e minore controllo sui margini.",
      bold: false
    },
    { text: "" },
    { text: "Interventi da attivare con priorita:", bold: true }
  );

  for (const item of assessment.urgentActions) {
    addWrappedLines(lines, `- ${item}`);
  }

  lines.push({ text: "" }, { text: "Rischi se non si interviene:", bold: true });

  for (const item of assessment.risks) {
    addWrappedLines(lines, `- ${item}`);
  }

  lines.push({ text: "" }, { text: "Criticita rilevate:", bold: true });

  for (const item of assessment.criticities) {
    addWrappedLines(lines, `- ${item}`);
  }

  lines.push({ text: "" }, { text: "Aree di miglioramento:", bold: true });
  for (const item of assessment.improvements) {
    addWrappedLines(lines, `- ${item}`);
  }

  lines.push({ text: "" }, { text: "Benefici stimati della digitalizzazione:", bold: true });
  for (const item of assessment.benefits) {
    addWrappedLines(lines, `- ${item}`);
  }

  lines.push({ text: "" }, { text: "Raccomandazioni prioritarie:", bold: true });
  for (const item of recommendations) {
    addWrappedLines(lines, `- ${item}`);
  }

  lines.push({ text: "" }, { text: "Risposte:", bold: true });
  for (const question of questions) {
    const selected = answers[question.id];
    addWrappedLines(lines, `- ${question.text}`, true);
    addWrappedLines(lines, `  Risposta: ${selected?.label || ""}`);
  }

  const pages = chunkLines(lines);
  const pageObjectStart = 5;
  const contentObjectStart = pageObjectStart + pages.length;
  const pageRefs = pages.map((_, index) => `${pageObjectStart + index} 0 R`).join(" ");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    ...pages.map((_, index) => createPageObject(contentObjectStart + index)),
    ...pages.map((pageLines) => {
      const stream = createPdfStream(pageLines);
      const streamBuffer = Buffer.from(stream, "latin1");
      return `<< /Length ${streamBuffer.length} >>\nstream\n${stream}\nendstream`;
    })
  ];

  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n", "latin1")];
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.concat(chunks).length);
    chunks.push(Buffer.from(`${index + 1} 0 obj\n${object}\nendobj\n`, "latin1"));
  });

  const body = Buffer.concat(chunks);
  const xrefOffset = body.length;
  const xref = [
    `xref\n0 ${objects.length + 1}`,
    "0000000000 65535 f ",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `),
    `trailer << /Size ${objects.length + 1} /Root 1 0 R >>`,
    "startxref",
    String(xrefOffset),
    "%%EOF"
  ].join("\n");

  return Buffer.concat([body, Buffer.from(xref, "latin1")]);
}
