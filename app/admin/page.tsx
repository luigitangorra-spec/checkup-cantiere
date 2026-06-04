"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  created_at: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  score: number;
  level: string;
  email_status: string;
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token") || "";
    setToken(urlToken);
    if (urlToken) {
      void loadLeads(urlToken);
    }
  }, []);

  async function loadLeads(activeToken = token) {
    setStatus("Caricamento lead...");
    try {
      const response = await fetch(`/api/leads?token=${encodeURIComponent(activeToken)}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Accesso non riuscito");
      }
      setLeads(payload);
      setStatus(`${payload.length} lead caricati.`);
    } catch (error) {
      setLeads([]);
      setStatus(error instanceof Error ? error.message : "Errore durante il caricamento");
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Pannello admin</p>
          <h1>Lead e score</h1>
        </div>
        <a className="secondary-link" href="/">
          Vai al test
        </a>
      </header>

      <section className="admin-tools">
        <label>
          Token admin
          <input value={token} type="password" onChange={(event) => setToken(event.target.value)} />
        </label>
        <button className="submit-button" type="button" onClick={() => loadLeads()}>
          Carica lead
        </button>
      </section>

      <p className="status">{status}</p>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Nome</th>
              <th>Azienda</th>
              <th>Email</th>
              <th>Telefono</th>
              <th>Score</th>
              <th>Profilo</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.created_at}</td>
                <td>{lead.name}</td>
                <td>{lead.company}</td>
                <td>{lead.email}</td>
                <td>{lead.phone}</td>
                <td>
                  <strong>{lead.score}</strong>
                </td>
                <td>{lead.level}</td>
                <td>{lead.email_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
