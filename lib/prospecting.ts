export type TargetTier = "A" | "B" | "C" | "D";

export type TargetCategory = {
  id: string;
  tier: TargetTier;
  label: string;
  stars: number;
  queries: string[];
  signals: string[];
};

export const targetCategories: TargetCategory[] = [
  {
    id: "imprese-edili",
    tier: "A",
    label: "Imprese edili generali",
    stars: 5,
    queries: [
      "impresa edile",
      "impresa di costruzioni",
      "costruzioni civili industriali",
      "ristrutturazioni restauri"
    ],
    signals: ["cantieri multipli", "subappalti", "documentazione tecnica", "controllo commessa"]
  },
  {
    id: "general-contractor",
    tier: "A",
    label: "General contractor",
    stars: 5,
    queries: ["general contractor edilizia", "riqualificazione energetica general contractor"],
    signals: ["gestione subappalti", "piu squadre", "controllo costi", "SAL"]
  },
  {
    id: "lavori-pubblici",
    tier: "A",
    label: "Lavori pubblici",
    stars: 4,
    queries: ["impresa lavori pubblici", "opere pubbliche manutenzioni pubbliche"],
    signals: ["appalti", "SAL", "documentazione", "tracciabilita"]
  },
  {
    id: "impiantisti-elettrici",
    tier: "B",
    label: "Impiantisti elettrici e fotovoltaico",
    stars: 4,
    queries: ["impianti elettrici industriali", "installatore fotovoltaico EPC"],
    signals: ["squadre sul campo", "rapportini", "materiali", "commesse"]
  },
  {
    id: "impiantisti-termoidraulici",
    tier: "B",
    label: "Termoidraulica, HVAC e climatizzazione",
    stars: 4,
    queries: ["impiantista termoidraulico HVAC", "climatizzazione pompe di calore"],
    signals: ["personale distribuito", "interventi", "materiali", "manutenzioni"]
  },
  {
    id: "serramenti-ascensori-antincendio",
    tier: "B",
    label: "Serramenti, ascensori e antincendio",
    stars: 4,
    queries: ["azienda serramenti installazione", "ascensori manutenzione", "impianti antincendio"],
    signals: ["installazioni", "manutenzioni periodiche", "documenti", "squadre"]
  },
  {
    id: "movimento-terra-infrastrutture",
    tier: "C",
    label: "Movimento terra, strade e infrastrutture",
    stars: 3,
    queries: ["movimento terra scavi demolizioni", "impresa stradale asfaltature"],
    signals: ["mezzi e squadre", "attivita sul campo", "avanzamento", "costi"]
  },
  {
    id: "carpenteria-prefabbricati-ponteggi",
    tier: "C",
    label: "Carpenteria, prefabbricati e ponteggi",
    stars: 3,
    queries: ["carpenteria metallica strutture", "prefabbricati capannoni", "ponteggi montaggio noleggio"],
    signals: ["produzione e posa", "logistica", "squadre", "commesse"]
  },
  {
    id: "facility-management",
    tier: "D",
    label: "Facility management e manutenzioni multisito",
    stars: 4,
    queries: [
      "facility management global service",
      "manutenzione industriale",
      "ESCO energy service company",
      "service tecnologici manutenzione impianti"
    ],
    signals: ["multisito", "personale distribuito", "ticket e interventi", "controllo SLA"]
  }
];

export const searchAreas = [
  { id: "bari", label: "Provincia di Bari", suffix: "provincia di Bari, Puglia" },
  { id: "bat", label: "BAT", suffix: "provincia di Barletta-Andria-Trani, Puglia" },
  { id: "brindisi", label: "Provincia di Brindisi", suffix: "provincia di Brindisi, Puglia" },
  { id: "foggia", label: "Provincia di Foggia", suffix: "provincia di Foggia, Puglia" },
  { id: "lecce", label: "Provincia di Lecce", suffix: "provincia di Lecce, Puglia" },
  { id: "taranto", label: "Provincia di Taranto", suffix: "provincia di Taranto, Puglia" },
  { id: "puglia", label: "Tutta la Puglia", suffix: "Puglia" }
];

export function getTargetCategory(id: string) {
  return targetCategories.find((category) => category.id === id);
}

export function getSearchArea(id: string) {
  return searchAreas.find((area) => area.id === id);
}

export function calculateProspectScore(input: {
  tier: TargetTier;
  areaId: string;
  website?: string | null;
  phone?: string | null;
  rating?: number | null;
  reviews?: number | null;
}) {
  const tierBase: Record<TargetTier, number> = { A: 72, B: 60, C: 48, D: 64 };
  let score = tierBase[input.tier];

  if (input.areaId === "bari") score += 10;
  if (input.website) score += 6;
  if (input.phone) score += 4;
  if ((input.reviews || 0) >= 10) score += 4;
  if ((input.reviews || 0) >= 40) score += 2;
  if ((input.rating || 0) >= 4) score += 2;

  return Math.min(100, score);
}

export function priorityLabel(score: number) {
  if (score >= 82) return "Priorita massima";
  if (score >= 68) return "Alta priorita";
  if (score >= 52) return "Da verificare";
  return "Bassa priorita";
}
