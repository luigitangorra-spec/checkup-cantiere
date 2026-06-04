"use client";

import { useMemo, useState } from "react";
import { questions } from "@/lib/quiz";

type Result = {
  id: string;
  score: number;
  level: string;
  summary: string;
  assessment?: {
    criticities: string[];
    improvements: string[];
    benefits: string[];
  };
  reportUrl: string;
  consultationUrl: string;
  emailStatus: string;
};

export default function HomePage() {
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const consultationUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/checkupcantiere/consulenza";
  const calendlyEmbed = useMemo(() => `${consultationUrl}?hide_gdpr_banner=1`, [consultationUrl]);

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Generazione report in corso...");

    const formData = new FormData(event.currentTarget);
    const lead = Object.fromEntries(["name", "company", "email", "phone"].map((key) => [key, formData.get(key)]));
    const answers = Object.fromEntries(questions.map((question) => [question.id, Number(formData.get(question.id))]));

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead, answers })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Errore durante l'invio");
      }

      setResult(payload);
      setStatus(
        payload.emailStatus.startsWith("sent")
          ? "Report inviato via email."
          : "Report creato. Configura Resend o Brevo per inviarlo automaticamente."
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("lead-submitted"));
        const win = window as Window & {
          gtag?: (...args: unknown[]) => void;
          fbq?: (...args: unknown[]) => void;
        };
        win.gtag?.("event", "generate_lead", { score: payload.score });
        win.fbq?.("track", "Lead");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Errore durante l'invio");
    }
  }

  return (
    <main className="site-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">checkupcantiere.it</p>
          <h1>Checkup Cantiere</h1>
          <p className="intro">
            Misura in 7 domande quanto la tua impresa edile e pronta a generare richieste qualificate online.
          </p>
          <a className="primary-link" href="#test">
            Inizia il test
          </a>
        </div>
        <div className="hero-panel">
          <span className="panel-label">Output immediato</span>
          <strong>Score 0-100</strong>
          <span>Report PDF personalizzato via email</span>
        </div>
      </section>

      <section id="test" className="test-layout">
        <form className="form-panel" onSubmit={submitLead}>
          <h2>Dati aziendali</h2>
          <div className="field-grid">
            <label>
              Nome <input name="name" autoComplete="name" required />
            </label>
            <label>
              Azienda <input name="company" autoComplete="organization" required />
            </label>
            <label>
              Email <input name="email" type="email" autoComplete="email" required />
            </label>
            <label>
              Telefono <input name="phone" autoComplete="tel" required />
            </label>
          </div>

          <h2>Quiz digitale</h2>
          <div className="questions">
            {questions.map((question, index) => (
              <fieldset className="question" key={question.id}>
                <legend>
                  {index + 1}. {question.text}
                </legend>
                {question.options.map((option) => (
                  <label className="option" key={`${question.id}-${option.value}`}>
                    <input type="radio" name={question.id} value={option.value} required />
                    <span>{option.label}</span>
                  </label>
                ))}
              </fieldset>
            ))}
          </div>

          <button className="submit-button" type="submit">
            Genera report PDF
          </button>
          <p className="status" role="status">
            {status}
          </p>
        </form>

        {result ? (
          <aside className="result-panel">
            <span className="panel-label">Risultato</span>
            <div className="score">
              <span>{result.score}</span>
              <small>/100</small>
            </div>
            <h2>{result.level}</h2>
            <p>{result.summary}</p>
            {result.assessment ? (
              <div className="assessment-summary">
                <h3>Criticita rilevate</h3>
                <ul>
                  {result.assessment.criticities.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <h3>Benefici stimati</h3>
                <ul>
                  {result.assessment.benefits.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="actions">
              <a className="secondary-link" href={result.reportUrl} target="_blank" rel="noreferrer">
                Scarica PDF
              </a>
              <a className="primary-link" href={result.consultationUrl} target="_blank" rel="noreferrer">
                Prenota consulenza
              </a>
            </div>
            <div className="calendly-box">
              <iframe title="Prenota consulenza Calendly" src={calendlyEmbed} />
            </div>
          </aside>
        ) : null}
      </section>
    </main>
  );
}
