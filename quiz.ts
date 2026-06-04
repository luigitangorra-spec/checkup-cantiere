export type QuizOption = {
  label: string;
  value: number;
  score?: number;
};

export type QuizQuestion = {
  id: string;
  text: string;
  options: QuizOption[];
};

export const questions: QuizQuestion[] = [
  {
    id: "cantieri_management",
    text: "Come gestite oggi i cantieri?",
    options: [
      { label: "WhatsApp", value: 0 },
      { label: "Telefonate", value: 2 },
      { label: "Fogli Excel", value: 6 },
      { label: "Altro", value: 7, score: 6 },
      { label: "Software gestionale", value: 14 }
    ]
  },
  {
    id: "daily_info",
    text: "Come ricevete le informazioni quotidiane dai capicantiere?",
    options: [
      { label: "Non esiste una procedura standard", value: 0 },
      { label: "WhatsApp", value: 3 },
      { label: "Rapportini cartacei", value: 4 },
      { label: "Email", value: 7 },
      { label: "Gestionale", value: 14 }
    ]
  },
  {
    id: "data_collection_time",
    text: "Quanto tempo impiegate ogni settimana per raccogliere e verificare dati provenienti dai cantieri?",
    options: [
      { label: "Oltre 10 ore", value: 0 },
      { label: "5-10 ore", value: 5 },
      { label: "2-5 ore", value: 9 },
      { label: "Meno di 2 ore", value: 14 }
    ]
  },
  {
    id: "real_time_cost_control",
    text: "Riuscite a conoscere in tempo reale costi, materiali utilizzati e ore lavorate per ogni cantiere?",
    options: [
      { label: "No", value: 0 },
      { label: "Solo a fine mese", value: 5 },
      { label: "Spesso", value: 10 },
      { label: "Sempre", value: 15 }
    ]
  },
  {
    id: "site_documents",
    text: "Come gestite documenti, certificazioni, foto e verbali di cantiere?",
    options: [
      { label: "WhatsApp", value: 0 },
      { label: "Archivio cartaceo", value: 3 },
      { label: "Altro", value: 5 },
      { label: "Cartelle condivise", value: 8 },
      { label: "Gestionale documentale", value: 14 }
    ]
  },
  {
    id: "work_progress_sal",
    text: "Come monitorate l'avanzamento lavori e i SAL?",
    options: [
      { label: "Non esiste un monitoraggio strutturato", value: 0 },
      { label: "Verifiche manuali", value: 4 },
      { label: "Excel", value: 7 },
      { label: "Software dedicato", value: 14 }
    ]
  },
  {
    id: "main_inefficiency",
    text: "Qual e oggi il problema che genera maggiori inefficienze nei vostri cantieri?",
    options: [
      { label: "Mancanza di controllo dei costi", value: 1, score: 0 },
      { label: "Comunicazione tra ufficio e cantiere", value: 2, score: 0 },
      { label: "Raccolta dati", value: 3, score: 0 },
      { label: "Gestione documentale", value: 4, score: 0 },
      { label: "Pianificazione attività", value: 5, score: 0 },
      { label: "Gestione personale", value: 6, score: 0 },
      { label: "Altro", value: 7, score: 0 }
    ]
  }
];

export type SelectedAnswers = Record<string, QuizOption>;

export type ReportAssessment = {
  criticities: string[];
  improvements: string[];
  urgentActions: string[];
  risks: string[];
  benefits: string[];
};

export function calculateScore(rawAnswers: Record<string, number>) {
  let rawScore = 0;
  const maxScore = questions.reduce((total, question) => {
    return total + Math.max(...question.options.map((option) => option.score ?? option.value));
  }, 0);

  const answers: SelectedAnswers = {};
  for (const question of questions) {
    const selectedValue = rawAnswers[question.id];
    const option = question.options.find((item) => item.value === selectedValue);
    if (!option) {
      throw new Error("Completa tutte le domande del quiz.");
    }
    answers[question.id] = option;
    rawScore += option.score ?? selectedValue;
  }

  const score = maxScore ? Math.round((rawScore / maxScore) * 100) : 0;
  return { score: Math.min(score, 100), answers };
}

export function scoreProfile(score: number) {
  if (score < 25) {
    return {
      level: "Digital Gap Critico",
      summary: "La gestione dei cantieri appare molto frammentata. Il rischio principale e perdere controllo su costi, tempi, documenti e informazioni operative."
    };
  }

  if (score < 50) {
    return {
      level: "Digital Gap Alto",
      summary: "Sono presenti processi manuali o strumenti non integrati. La priorita e standardizzare raccolta dati, comunicazioni e controllo economico."
    };
  }

  if (score < 75) {
    return {
      level: "Digital Gap Medio",
      summary: "La gestione e parzialmente strutturata, ma restano aree migliorabili su tracciabilita, reportistica e controllo in tempo reale."
    };
  }

  return {
    level: "Digital Gap Basso",
    summary: "La gestione digitale dei cantieri e gia ben avviata. La priorita e ottimizzare integrazioni, automazioni e indicatori di performance."
  };
}

export function buildAssessment(answers: SelectedAnswers): ReportAssessment {
  const criticities: string[] = [];
  const improvements: string[] = [];
  const urgentActions: string[] = [];
  const risks: string[] = [];
  const benefits = [
    "Riduzione tempi amministrativi",
    "Maggiore controllo costi",
    "Riduzione errori operativi",
    "Migliore tracciabilita",
    "Maggiore produttivita dei cantieri"
  ];

  const add = (condition: boolean, criticity: string, improvement: string, urgentAction: string, risk: string) => {
    if (!condition) {
      return;
    }
    criticities.push(criticity);
    improvements.push(improvement);
    urgentActions.push(urgentAction);
    risks.push(risk);
  };

  add(
    ["WhatsApp", "Telefonate", "Fogli Excel", "Altro"].includes(answers.cantieri_management?.label),
    "La gestione dei cantieri e distribuita su strumenti non integrati. Questo crea una dipendenza eccessiva da persone, messaggi e memoria operativa.",
    "Centralizzare commesse, attivita, responsabili e stati avanzamento in un unico ambiente operativo.",
    "Definire entro breve un sistema unico per gestire commesse, scadenze, responsabilita e stato dei cantieri.",
    "Senza un presidio centrale, aumentano ritardi, decisioni basate su dati incompleti e perdita di controllo sull'avanzamento reale."
  );

  add(
    ["Non esiste una procedura standard", "WhatsApp", "Rapportini cartacei"].includes(answers.daily_info?.label),
    "Le informazioni quotidiane dai capicantiere non sono strutturate in modo affidabile. Il rischio e che dati importanti arrivino tardi, incompleti o non verificabili.",
    "Introdurre una procedura standard per rapportini digitali e comunicazioni ufficio-cantiere.",
    "Standardizzare il flusso giornaliero dei rapportini con campi obbligatori, responsabili e tempi di invio definiti.",
    "La mancata standardizzazione rende difficile ricostruire cosa e successo in cantiere e rallenta le decisioni dell'ufficio."
  );

  add(
    ["5-10 ore", "Oltre 10 ore"].includes(answers.data_collection_time?.label),
    "La raccolta e verifica manuale dei dati assorbe troppo tempo ogni settimana. Questo e un costo nascosto che riduce produttivita e velocita di controllo.",
    "Automatizzare raccolta dati da cantiere e validazione delle informazioni operative.",
    "Eliminare passaggi doppi e reinserimenti manuali, portando i dati di cantiere direttamente in una dashboard operativa.",
    "Continuare con processi manuali mantiene alto il rischio di errori, ritardi amministrativi e dati non confrontabili tra cantieri."
  );

  add(
    ["No", "Solo a fine mese"].includes(answers.real_time_cost_control?.label),
    "Il controllo economico non e disponibile in tempo reale. Costi, materiali e ore vengono letti troppo tardi rispetto all'andamento effettivo della commessa.",
    "Attivare dashboard per costi, ore, materiali e margini per singolo cantiere.",
    "Costruire un controllo per commessa con ore, materiali, costi consuntivi e scostamenti rispetto al preventivo.",
    "Se il controllo resta a fine mese, eventuali extra costi emergono quando il margine e gia compromesso."
  );

  add(
    ["WhatsApp", "Archivio cartaceo", "Altro"].includes(answers.site_documents?.label),
    "La gestione documentale espone l'impresa a perdita di foto, verbali, certificazioni e informazioni tecniche. La documentazione non e sempre recuperabile rapidamente.",
    "Organizzare documenti, foto e verbali in un archivio digitale collegato alla commessa.",
    "Creare un archivio documentale per cantiere con categorie, permessi, foto, verbali, certificazioni e storico consultabile.",
    "Una documentazione dispersa aumenta contestazioni, rallenta verifiche e rende piu debole la tracciabilita verso clienti e fornitori."
  );

  add(
    ["Non esiste un monitoraggio strutturato", "Verifiche manuali", "Excel"].includes(answers.work_progress_sal?.label),
    "Il monitoraggio di avanzamento lavori e SAL non appare sufficientemente strutturato. Questo limita la capacita di prevedere ritardi e governare la produzione.",
    "Digitalizzare pianificazione, avanzamento lavori e SAL con indicatori aggiornati.",
    "Impostare un controllo periodico su avanzamento, SAL, scostamenti, blocchi e prossime attivita per ogni cantiere.",
    "Senza monitoraggio strutturato, ritardi e blocchi emergono tardi e diventano piu costosi da correggere."
  );

  const mainIssue = answers.main_inefficiency?.label;
  if (mainIssue && mainIssue !== "Altro") {
    criticities.unshift(`Priorita percepita dal cliente: ${mainIssue}.`);
  }

  return {
    criticities: criticities.slice(0, 5),
    improvements: improvements.slice(0, 5),
    urgentActions: urgentActions.slice(0, 5),
    risks: risks.slice(0, 5),
    benefits
  };
}

export const recommendations = [
  "Avviare un audit operativo sui flussi ufficio-cantiere per identificare passaggi manuali, colli di bottiglia e dati mancanti.",
  "Definire un modello unico di gestione cantiere: rapportini, documenti, ore, materiali, SAL e responsabilita.",
  "Implementare una dashboard direzionale che evidenzi costi, scostamenti, avanzamento lavori e criticita per singola commessa.",
  "Ridurre l'uso di canali dispersi come WhatsApp, telefonate e archivi cartacei nei processi critici.",
  "Stabilire indicatori minimi da controllare ogni settimana: ore lavorate, materiali usati, avanzamento, blocchi, documenti mancanti e margine stimato."
];
