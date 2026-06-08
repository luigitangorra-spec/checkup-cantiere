"use client";

import { useEffect, useState } from "react";
import { searchAreas, targetCategories } from "@/lib/prospecting";

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

type Prospect = {
  id: string;
  company: string;
  category_label: string;
  target_tier: string;
  address: string;
  phone: string;
  website: string;
  maps_url: string;
  rating: number | null;
  reviews_count: number;
  score: number;
  priority: string;
  status: "new" | "approved" | "discarded" | "contacted";
  qualification_notes: string;
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [status, setStatus] = useState("");
  const [view, setView] = useState<"leads" | "prospects">("leads");
  const [categoryId, setCategoryId] = useState("imprese-edili");
  const [areaId, setAreaId] = useState("bari");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token") || "";
    setToken(urlToken);
    if (urlToken) {
      void loadLeads(urlToken);
      void loadProspects(urlToken);
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

  async function loadProspects(activeToken = token) {
    try {
      const response = await fetch(`/api/prospects?token=${encodeURIComponent(activeToken)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Caricamento prospect non riuscito");
      setProspects(payload);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Errore durante il caricamento prospect");
    }
  }

  async function searchProspects() {
    setSearching(true);
    setStatus("Ricerca aziende in corso...");
    try {
      const response = await fetch("/api/prospects/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, categoryId, areaId, limit: 20 })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Ricerca non riuscita");
      await loadProspects();
      setStatus(`${payload.found} aziende trovate e aggiornate.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Errore durante la ricerca");
    } finally {
      setSearching(false);
    }
  }

  async function updateProspect(id: string, nextStatus: Prospect["status"]) {
    setStatus("Aggiornamento prospect...");
    try {
      const response = await fetch("/api/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, id, status: nextStatus })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Aggiornamento non riuscito");
      setProspects((current) =>
        current.map((prospect) => (prospect.id === id ? { ...prospect, status: nextStatus } : prospect))
      );
      setStatus("Prospect aggiornato.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Errore durante l'aggiornamento");
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
          Aggiorna dati
        </button>
      </section>

      <nav className="admin-tabs" aria-label="Sezioni amministrazione">
        <button
          type="button"
          className={view === "leads" ? "active" : ""}
          onClick={() => setView("leads")}
        >
          Lead del test
        </button>
        <button
          type="button"
          className={view === "prospects" ? "active" : ""}
          onClick={() => setView("prospects")}
        >
          Ricerca aziende
        </button>
      </nav>

      <p className="status">{status}</p>

      {view === "leads" ? (
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
      ) : (
        <>
          <section className="prospect-search">
            <label>
              Territorio
              <select value={areaId} onChange={(event) => setAreaId(event.target.value)}>
                {searchAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Categoria
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                {targetCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    Target {category.tier} - {category.label}
                  </option>
                ))}
              </select>
            </label>
            <button className="submit-button" type="button" disabled={searching} onClick={searchProspects}>
              {searching ? "Ricerca..." : "Cerca 20 aziende"}
            </button>
          </section>

          <p className="prospect-note">
            I risultati sono prospect pubblici da qualificare. La dimensione aziendale e i decisori
            devono essere verificati prima del contatto.
          </p>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Score</th>
                  <th>Azienda</th>
                  <th>Target</th>
                  <th>Contatti pubblici</th>
                  <th>Segnali</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((prospect) => (
                  <tr key={prospect.id}>
                    <td>
                      <strong>{prospect.score}</strong>
                      <small className="table-detail">{prospect.priority}</small>
                    </td>
                    <td>
                      <strong>{prospect.company}</strong>
                      <small className="table-detail">{prospect.address}</small>
                    </td>
                    <td>
                      <span className={`tier-badge tier-${prospect.target_tier}`}>
                        {prospect.target_tier}
                      </span>
                      <small className="table-detail">{prospect.category_label}</small>
                    </td>
                    <td>
                      {prospect.phone && <span>{prospect.phone}</span>}
                      <div className="compact-links">
                        {prospect.website && (
                          <a href={prospect.website} target="_blank" rel="noreferrer">
                            Sito
                          </a>
                        )}
                        {prospect.maps_url && (
                          <a href={prospect.maps_url} target="_blank" rel="noreferrer">
                            Maps
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      <small>{prospect.qualification_notes}</small>
                      {prospect.rating && (
                        <small className="table-detail">
                          Google {prospect.rating} ({prospect.reviews_count})
                        </small>
                      )}
                    </td>
                    <td>{prospect.status}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={() => updateProspect(prospect.id, "approved")}>
                          Approva
                        </button>
                        <button type="button" onClick={() => updateProspect(prospect.id, "discarded")}>
                          Scarta
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
