

import type { StudyNote } from "./api";

export interface CadernoPersonalNote {
  id: string;
  backendId?: number;
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

function getUserStorageKey(userId?: number | string): string {
  return userId ? `${STORAGE_KEY}_user_${userId}` : STORAGE_KEY;
}

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

export interface CadernoPayload {
  nexusCadernoVersion: number;
  materia: string;
  planoEstudo: string;
  ideiasMnemonic: string;
  pegadinhas: string;
  resumoEsquematizado: string;
  nivelImportancia?: "alta" | "media" | "baixa";
  revisadoVezes?: number;
  ultimaRevisao?: string;
  tags?: string[];
}

export function encodeCadernoPayload(note: {
  materia: string;
  planoEstudo: string;
  ideiasMnemonic: string;
  pegadinhas: string;
  resumoEsquematizado: string;
  nivelImportancia?: "alta" | "media" | "baixa";
  revisadoVezes?: number;
  ultimaRevisao?: string;
  tags?: string[];
}): string {
  const payload: CadernoPayload = {
    nexusCadernoVersion: 1,
    materia: note.materia || "Geral",
    planoEstudo: note.planoEstudo || "Geral / Concursos",
    ideiasMnemonic: note.ideiasMnemonic || "",
    pegadinhas: note.pegadinhas || "",
    resumoEsquematizado: note.resumoEsquematizado || "",
    nivelImportancia: note.nivelImportancia || "alta",
    revisadoVezes: note.revisadoVezes || 0,
    ultimaRevisao: note.ultimaRevisao,
    tags: note.tags || [],
  };
  return JSON.stringify(payload);
}

export function parseStudyNoteToCaderno(sn: StudyNote): CadernoPersonalNote {
  if (sn.conteudo) {
    try {
      const parsed = JSON.parse(sn.conteudo);
      if (parsed && typeof parsed === "object" && (parsed.materia || parsed.nexusCadernoVersion)) {
        return {
          id: `cloud-${sn.id}`,
          backendId: sn.id,
          titulo: sn.titulo,
          materia: parsed.materia || "Geral",
          planoEstudo: parsed.planoEstudo || "Geral / Concursos",
          ideiasMnemonic: parsed.ideiasMnemonic || "",
          pegadinhas: parsed.pegadinhas || "",
          resumoEsquematizado: parsed.resumoEsquematizado || "",
          nivelImportancia: parsed.nivelImportancia || "alta",
          revisadoVezes: Number(parsed.revisadoVezes) || 0,
          ultimaRevisao: parsed.ultimaRevisao,
          tags: parsed.tags || [],
          criadoEm: sn.atualizadoEm || new Date().toISOString(),
          atualizadoEm: sn.atualizadoEm || new Date().toISOString(),
        };
      }
    } catch {
      // Conteúdo em texto puro criado via /estudo ou legacy
    }
  }

  return {
    id: `cloud-${sn.id}`,
    backendId: sn.id,
    titulo: sn.titulo,
    materia: "Geral",
    planoEstudo: "Geral / Concursos",
    ideiasMnemonic: "",
    pegadinhas: "",
    resumoEsquematizado: sn.conteudo || "",
    nivelImportancia: "alta",
    revisadoVezes: 0,
    criadoEm: sn.atualizadoEm || new Date().toISOString(),
    atualizadoEm: sn.atualizadoEm || new Date().toISOString(),
  };
}

export function listCadernoPersonalNotes(userId?: number | string): CadernoPersonalNote[] {
  try {
    const key = getUserStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      // Se não tem chave de usuário mas tem a global, reaproveita
      if (userId) {
        const fallback = localStorage.getItem(STORAGE_KEY);
        if (fallback) {
          try {
            const parsedFallback = JSON.parse(fallback);
            if (Array.isArray(parsedFallback) && parsedFallback.length > 0) {
              localStorage.setItem(key, fallback);
              return parsedFallback;
            }
          } catch {}
        }
      }
      localStorage.setItem(key, JSON.stringify(INITIAL_DEMO_NOTES));
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
  note: Omit<CadernoPersonalNote, "id" | "criadoEm" | "atualizadoEm" | "revisadoVezes"> & { id?: string; revisadoVezes?: number },
  userId?: number | string
): CadernoPersonalNote {
  const current = listCadernoPersonalNotes(userId);
  const now = new Date().toISOString();
  const key = getUserStorageKey(userId);

  if (note.id) {
    const idx = current.findIndex((n) => n.id === note.id || (note.backendId && n.backendId === note.backendId));
    if (idx >= 0) {
      const updated: CadernoPersonalNote = {
        ...current[idx],
        ...note,
        id: note.id,
        backendId: note.backendId ?? current[idx].backendId,
        atualizadoEm: now,
      };
      current[idx] = updated;
      localStorage.setItem(key, JSON.stringify(current));
      return updated;
    }
  }

  const created: CadernoPersonalNote = {
    ...note,
    id: note.id || "note-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
    revisadoVezes: note.revisadoVezes || 0,
    criadoEm: now,
    atualizadoEm: now,
  };
  current.unshift(created);
  localStorage.setItem(key, JSON.stringify(current));
  return created;
}

export function updateCadernoPersonalNotesList(notes: CadernoPersonalNote[], userId?: number | string): void {
  const key = getUserStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(notes));
}

export function deleteCadernoPersonalNote(id: string, userId?: number | string): void {
  const current = listCadernoPersonalNotes(userId);
  const filtered = current.filter((n) => n.id !== id);
  const key = getUserStorageKey(userId);
  localStorage.setItem(key, JSON.stringify(filtered));
}

export function recordCadernoNoteReview(id: string, userId?: number | string): void {
  const current = listCadernoPersonalNotes(userId);
  const idx = current.findIndex((n) => n.id === id);
  if (idx >= 0) {
    current[idx].revisadoVezes = (current[idx].revisadoVezes || 0) + 1;
    current[idx].ultimaRevisao = new Date().toISOString();
    const key = getUserStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(current));
  }
}

export function exportCadernoNotesToJson(userId?: number | string): string {
  const notes = listCadernoPersonalNotes(userId);
  return JSON.stringify(
    {
      app: "Nexus Concursos",
      exportedAt: new Date().toISOString(),
      count: notes.length,
      notes,
    },
    null,
    2
  );
}

export function importCadernoNotesFromJson(jsonStr: string, userId?: number | string): { success: boolean; count: number } {
  try {
    const parsed = JSON.parse(jsonStr);
    const candidateList = Array.isArray(parsed) ? parsed : parsed?.notes;
    if (!Array.isArray(candidateList)) {
      return { success: false, count: 0 };
    }

    const current = listCadernoPersonalNotes(userId);
    const currentTitles = new Set(current.map((c) => c.titulo.trim().toLowerCase()));
    let importedCount = 0;

    for (const item of candidateList) {
      if (item && item.titulo) {
        if (!currentTitles.has(item.titulo.trim().toLowerCase())) {
          current.unshift({
            id: item.id || `imported-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            backendId: item.backendId,
            titulo: String(item.titulo).trim(),
            materia: String(item.materia || "Geral").trim(),
            planoEstudo: String(item.planoEstudo || "Geral / Concursos").trim(),
            ideiasMnemonic: String(item.ideiasMnemonic || "").trim(),
            pegadinhas: String(item.pegadinhas || "").trim(),
            resumoEsquematizado: String(item.resumoEsquematizado || "").trim(),
            nivelImportancia: item.nivelImportancia || "alta",
            revisadoVezes: Number(item.revisadoVezes) || 0,
            criadoEm: item.criadoEm || new Date().toISOString(),
            atualizadoEm: new Date().toISOString(),
          });
          importedCount++;
        }
      }
    }

    updateCadernoPersonalNotesList(current, userId);
    return { success: true, count: importedCount };
  } catch {
    return { success: false, count: 0 };
  }
}
