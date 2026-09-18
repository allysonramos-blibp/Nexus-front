

export interface CadernoPersonalNote {
  id: string;
  titulo: string;
  materia: string;
  planoEstudo: string;
  ideiasMnemonic: string;
  pegadinhas: string;
  resumoEsquematizado: string;
  tags?: string[];
  nivelImportancia?: "alta" | "media" | "baixa";
  revisadoVezes: number;
  ultimaRevisao?: string;
  criadoEm: string;
  atualizadoEm: string;
}

const STORAGE_KEY = "nexus_caderno_personal_notes_v1";

const INITIAL_DEMO_NOTES: CadernoPersonalNote[] = [
  {
    id: "demo-note-1",
    titulo: "Atos Administrativos — Convalidação (Foco e FO.CO)",
    materia: "Direito Administrativo",
    planoEstudo: "Polícia Federal / Concursos Fiscais",
    ideiasMnemonic: "Mnemônico clássico FO.CO: Só convalidam vício de FORMA (quando não essencial) e de COMPETÊNCIA (quando não exclusiva). Se mexer no MOTIVO, OBJETO ou FINALIDADE é NULIDADE ABSOLUTA!",
    pegadinhas: "A banca (Cespe/FGV) adora dizer que a convalidação é OBRIGATÓRIA. Pegadinha: a regra geral da doutrina majoritária é ato DISCRICIONÁRIO da Administração, desde que não acarrete lesão ao interesse público nem prejuízo a terceiros.",
    resumoEsquematizado: "• Requisitos da Convalidação (Art. 55 da Lei 9.784/99):\n  - Ausência de lesão ao interesse público\n  - Ausência de prejuízo a terceiros\n  - Defeitos sanáveis: Competência (não exclusiva) e Forma (não essencial à validade).\n• Efeitos: EX TUNC (retroage à data do ato originário).",
    nivelImportancia: "alta",
    tags: ["atos", "convalidacao", "art55"],
    revisadoVezes: 2,
    ultimaRevisao: new Date(Date.now() - 86400000).toISOString(),
    criadoEm: new Date(Date.now() - 86400000 * 3).toISOString(),
    atualizadoEm: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-note-2",
    titulo: "Crase Proibida & Casos Facultativos",
    materia: "Língua Portuguesa",
    planoEstudo: "Geral para Carreiras Policiais & Tribunais",
    ideiasMnemonic: "Facultativa: 'Até a sua Maria' (Até / Pronome possessivo feminino singular / Nome próprio feminino). Não tem crase antes de verbo, palavra masculina ou pronomes de tratamento (salvo dona/senhora/senhorita).",
    pegadinhas: "Se o pronome possessivo feminino estiver no PLURAL e sem artigo ('a suas ordens'), NÃO HÁ CRASE! Só há se vier 'às suas ordens'. Cuidado supremo com palavras masculinas disfarçadas de femininas.",
    resumoEsquematizado: "• CRASE FACULTATIVA:\n  1. Antes de pronome possessivo feminino singular (minha, sua, tua);\n  2. Antes de nome próprio feminino;\n  3. Depois da preposição 'até'.\n• CRASE PROIBIDA:\n  - Antes de verbo ('a partir de');\n  - Antes de masculino ('a pé', 'a prazo');\n  - Palavras repetidas ('frente a frente').",
    nivelImportancia: "alta",
    tags: ["crase", "gramatica", "fgv"],
    revisadoVezes: 1,
    ultimaRevisao: new Date().toISOString(),
    criadoEm: new Date(Date.now() - 86400000 * 2).toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
];

export function listCadernoPersonalNotes(): CadernoPersonalNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DEMO_NOTES));
      return INITIAL_DEMO_NOTES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return INITIAL_DEMO_NOTES;
  } catch {
    return INITIAL_DEMO_NOTES;
  }
}

export function saveCadernoPersonalNote(
  note: Omit<CadernoPersonalNote, "id" | "criadoEm" | "atualizadoEm" | "revisadoVezes"> & { id?: string }
): CadernoPersonalNote {
  const current = listCadernoPersonalNotes();
  const now = new Date().toISOString();

  if (note.id) {
    const idx = current.findIndex((n) => n.id === note.id);
    if (idx >= 0) {
      const updated: CadernoPersonalNote = {
        ...current[idx],
        ...note,
        id: note.id,
        atualizadoEm: now,
      };
      current[idx] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      return updated;
    }
  }

  const created: CadernoPersonalNote = {
    ...note,
    id: "note-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    revisadoVezes: 0,
    criadoEm: now,
    atualizadoEm: now,
  };
  current.unshift(created);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return created;
}

export function deleteCadernoPersonalNote(id: string): void {
  const current = listCadernoPersonalNotes();
  const filtered = current.filter((n) => n.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function recordCadernoNoteReview(id: string): void {
  const current = listCadernoPersonalNotes();
  const idx = current.findIndex((n) => n.id === id);
  if (idx >= 0) {
    current[idx].revisadoVezes = (current[idx].revisadoVezes || 0) + 1;
    current[idx].ultimaRevisao = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
}
