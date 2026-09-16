/**
 * Armazenamento local persistente para anotações detalhadas de estudo
 * e mapa mental / resumo do Caderno de Erros e Revisões.
 */

export interface CadernoItemNote {
  errorId: number;
  questionId: number;
  resumoRegra?: string; // O que memorizar (ex: "Art. 5º, XI - flagrante delito...")
  comoNaoErrar?: string; // A pegadinha da questão
  anotacaoLivre?: string; // Anotações complementares do aluno
  atualizadoEm: string;
}

const STORAGE_KEY = "nexus_caderno_detailed_notes_v1";

function loadAllNotes(): Record<number, CadernoItemNote> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAllNotes(data: Record<number, CadernoItemNote>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Falha ao salvar anotação do caderno no localStorage", err);
  }
}

export function getCadernoNote(errorId: number): CadernoItemNote | null {
  const all = loadAllNotes();
  return all[errorId] || null;
}

export function saveCadernoNote(note: CadernoItemNote): void {
  const all = loadAllNotes();
  all[note.errorId] = {
    ...note,
    atualizadoEm: new Date().toISOString(),
  };
  saveAllNotes(all);
}

export function removeCadernoNote(errorId: number): void {
  const all = loadAllNotes();
  delete all[errorId];
  saveAllNotes(all);
}
