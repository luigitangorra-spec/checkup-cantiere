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
  const benefits = [
    "Riduzione tempi amministrativi",
    "Maggiore controllo costi",
    "Riduzione errori operativi",
    "Migliore tracciabilita",
    "Maggiore produttivita dei cantieri"
  ];

  const add = (condition: boolean, criticity: string, improvement: string) => {
    if (!condition) {
      return;
    }
    criticities.push(criticity);
    improvements.push(improvement);
  };

  add(
    ["WhatsApp", "Telefonate", "Fogli Excel", "Altro"].includes(answers.cantieri_management?.label),
    "Gestione cantieri distribuita su strumenti non integrati.",
    "Centralizzare commesse, attivita, responsabili e stati avanzamento in un unico ambiente operativo."
  );

  add(
    ["Non esiste una procedura standard", "WhatsApp", "Rapportini cartacei"].includes(answers.daily_info?.label),
    "Informazioni quotidiane esposte a ritardi, duplicazioni e perdita di contesto.",
    "Introdurre una procedura standard per rapportini digitali e comunicazioni ufficio-cantiere."
  );

  add(
    ["5-10 ore", "Oltre 10 ore"].includes(answers.data_collection_time?.label),
    "Molto tempo assorbito da raccolta e verifica manuale dei dati.",
    "Automatizzare raccolta dati da cantiere e validazione delle informazioni operative."
  );

  add(
    ["No", "Solo a fine mese"].includes(answers.real_time_cost_control?.label),
    "Controllo economico tardivo su costi, materiali e ore lavorate.",
    "Attivare dashboard per costi, ore, materiali e margini per singolo cantiere."
  );

  add(
    ["WhatsApp", "Archivio cartaceo", "Altro"].includes(answers.site_documents?.label),
    "Rischio di perdita documentale e difficolta nel recupero di foto, verbali e certificazioni.",
    "Organizzare documenti, foto e verbali in un archivio digitale collegato alla commessa."
  );

  add(
    ["Non esiste un monitoraggio strutturato", "Verifiche manuali", "Excel"].includes(answers.work_progress_sal?.label),
    "Monitoraggio avanzamento lavori e SAL poco strutturato.",
    "Digitalizzare pianificazione, avanzamento lavori e SAL con indicatori aggiornati."
  );

  const mainIssue = answers.main_inefficiency?.label;
  if (mainIssue && mainIssue !== "Altro") {
    criticities.unshift(`Priorita percepita dal cliente: ${mainIssue}.`);
  }

  return {
    criticities: criticities.slice(0, 5),
    improvements: improvements.slice(0, 5),
    benefits
  };
}

export const recommendations = [
  "Definire un flusso digitale standard per raccolta dati, rapportini e documenti di cantiere.",
  "Collegare avanzamento lavori, ore, materiali e costi a una dashboard di controllo per commessa.",
  "Ridurre l'uso di canali dispersi come WhatsApp, telefonate e archivi cartacei nei processi critici."
];
