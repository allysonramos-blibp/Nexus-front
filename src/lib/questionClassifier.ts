import type { Question } from "./api";

const GENERIC_NAMES = new Set([
  "geral",
  "gerais",
  "conhecimentos gerais",
  "todas",
  "todas as matérias",
  "todas as matérias (geral)",
  "todos os assuntos",
  "todos os assuntos (geral)",
  "plano geral",
  "materia geral",
]);

const SUBJECT_RULES: { label: string; regex: RegExp }[] = [
  {
    label: "Raciocínio Lógico",
    regex: /\b(?:racioc[íi]nio\s+l[óo]gico(?:-matem[áa]tico)?|rlm|l[óo]gica(?:\s+matem[áa]tica)?|proposi[çc][ãa]o|tabela\s+verdade)\b/i,
  },
  {
    label: "Português",
    regex: /\b(?:l[íi]ngua\s+portuguesa|portugu[êe]s|gram[áa]tica|interpreta[çc][ãa]o\s+de\s+textos?|concord[âa]ncia|reg[êe]ncia|crase|pontua[çc][ãa]o)\b/i,
  },
  {
    label: "Inglês",
    regex: /\b(?:l[íi]ngua\s+inglesa|ingl[êe]s|english|reading\s+comprehension)\b/i,
  },
  {
    label: "Informática",
    regex: /\b(?:inform[áa]tica|tecnologia\s+da\s+informa[çc][ãa]o|\bti\b|hardware|software|redes\s+de\s+computadores|seguran[çc]a\s+da\s+informa[çc][ãa]o|planilha|excel|calc|linux|windows)\b/i,
  },
  {
    label: "Direito Constitucional",
    regex: /\b(?:direito\s+constitucional|constitucional|cf\/?88|constitui[çc][ãa]o\s+federal|direitos\s+fundamentais|rem[ée]dios\s+constitucionais)\b/i,
  },
  {
    label: "Direito Administrativo",
    regex: /\b(?:direito\s+administrativo|administrativo|lei\s*8\.?112|lei\s*14\.?133|atos?\s+administrativos?|poderes\s+administrativos?|licita[çc][ãa]o|servidores?\s+p[úu]blicos?)\b/i,
  },
  {
    label: "Direito Penal",
    regex: /\b(?:direito\s+penal|c[óo]digo\s+penal|\bpenal\b|crime|tipicidade|ilicitude|culpabilidade)\b/i,
  },
  {
    label: "Direito Processual Penal",
    regex: /\b(?:processo\s+penal|processual\s+penal|\bcpp\b|inqu[ée]rito\s+policial|a[çc][ãa]o\s+penal|pris[ãa]o\s+em\s+flagrante)\b/i,
  },
  {
    label: "Direito Civil",
    regex: /\b(?:direito\s+civil|c[óo]digo\s+civil|\bcivil\b|pessoa\s+jur[íi]dica|neg[óo]cio\s+jur[íi]dico|obriga[çc][õo]es|contratos)\b/i,
  },
  {
    label: "Direito Processual Civil",
    regex: /\b(?:processo\s+civil|processual\s+civil|\bcpc\b|peti[çc][ãa]o\s+inicial|recursos?\s+c[íi]veis?)\b/i,
  },
  {
    label: "Matemática",
    regex: /\b(?:matem[áa]tica(?!\s+financeira)|geometria|equa[çc][ãa]o|porcentagem|regra\s+de\s+tr[êe]s)\b/i,
  },
  {
    label: "Matemática Financeira",
    regex: /\b(?:matem[áa]tica\s+financeira|juros?\s+simples|juros?\s+compostos|amortiza[çc][ãa]o)\b/i,
  },
  {
    label: "Atualidades",
    regex: /\b(?:atualidades|geopol[íi]tica|cen[áa]rio\s+pol[íi]tico|sustentabilidade|meio\s+ambiente)\b/i,
  },
  {
    label: "Ética no Serviço Público",
    regex: /\b(?:[ée]tica(?:\s+no\s+servi[çc]o\s+p[úu]blico)?|decreto\s*1\.?171|comiss[ãa]o\s+de\s+[ée]tica)\b/i,
  },
  {
    label: "Legislação Especial",
    regex: /\b(?:legisla[çc][ãa]o(?:\s+especial|\s+extravagante)?|abuso\s+de\s+autoridade|lei\s+de\s+drogas|estatuto\s+do\s+desarmamento)\b/i,
  },
  {
    label: "Contabilidade",
    regex: /\b(?:contabilidade(?:\s+geral|\s+p[úu]blica)?|balan[çc]o\s+patrimonial|dre|lan[çc]amentos?\s+cont[áa]beis?)\b/i,
  },
  {
    label: "Administração Pública",
    regex: /\b(?:administra[çc][ãa]o(?:\s+p[úu]blica|\s+geral)?|gest[ãa]o\s+p[úu]blica|governabilidade|governan[çc]a)\b/i,
  },
  {
    label: "Direitos Humanos",
    regex: /\b(?:direitos?\s+humanos?|dudh|conven[çc][ãa]o\s+americana)\b/i,
  },
  {
    label: "Espanhol",
    regex: /\b(?:espanhol|l[íi]ngua\s+espanhola|spanish)\b/i,
  },
];

/**
 * Extrai o número da questão, verificando primeiro a propriedade `numero`
 * e em seguida padrões no texto do enunciado (ex: "Questão 01", "01.", "#1", "[1]").
 */
export function extractQuestionNumber(
  q: { numero?: number | null; enunciado?: string },
  fallbackIndex?: number
): number {
  if (typeof q.numero === "number" && q.numero > 0) {
    return q.numero;
  }

  const text = q.enunciado?.trim() || "";
  if (text) {
    // 1. "Questão 01", "Questao 1", "Q1", "#1"
    const m1 = text.match(/^(?:Quest[ãa]o\s*|Q\s*|#\s*)0*(\d+)\b/i);
    if (m1) return parseInt(m1[1], 10);

    // 2. "[01]", "[1]"
    const m2 = text.match(/^\[\s*0*(\d+)\s*\]/);
    if (m2) return parseInt(m2[1], 10);

    // 3. "01.", "1.", "01 -", "1 -", "1)", "01:"
    const m3 = text.match(/^0*(\d+)\s*[\.\:\-\)\–\—]/);
    if (m3) return parseInt(m3[1], 10);

    // 4. "Questão 12" em qualquer ponto no início (até primeiros 40 caracteres)
    const m4 = text.slice(0, 50).match(/\bQuest[ãa]o\s*0*(\d+)\b/i);
    if (m4) return parseInt(m4[1], 10);
  }

  return fallbackIndex !== undefined ? fallbackIndex + 1 : 1;
}

/**
 * Detecta a matéria a partir do texto do enunciado ou do cabeçalho.
 */
export function detectSubjectFromText(text: string): string | null {
  if (!text) return null;
  const headerSlice = text.slice(0, 160);

  // 1. Se tem prefixo tipo [Português] ou (Raciocínio Lógico)
  const bracketMatch = headerSlice.match(/^[\(\[]\s*([^\]\)]+?)\s*[\)\]]/);
  if (bracketMatch) {
    const rawTag = bracketMatch[1].trim();
    // Verifica se corresponde a alguma regra
    for (const rule of SUBJECT_RULES) {
      if (rule.regex.test(rawTag)) {
        return rule.label;
      }
    }
    // Se for curto e não for número nem banca pura
    if (
      rawTag.length >= 3 &&
      rawTag.length <= 35 &&
      !/^\d+$/.test(rawTag) &&
      !/^(CESPE|FGV|FCC|VUNESP|IBFC|QUADRIX)$/i.test(rawTag)
    ) {
      return rawTag;
    }
  }

  // 2. Prefixos tipo "Matéria: Português" ou "Disciplina: Raciocínio Lógico"
  const materiaPrefixMatch = headerSlice.match(/(?:Mat[ée]ria|Disciplina)\s*[:\-]\s*([A-Za-zÀ-ÿ\s\-]{3,35})/i);
  if (materiaPrefixMatch) {
    const rawTag = materiaPrefixMatch[1].trim();
    for (const rule of SUBJECT_RULES) {
      if (rule.regex.test(rawTag)) {
        return rule.label;
      }
    }
    return rawTag;
  }

  // 3. Busca nas regras conhecidas de concursos
  for (const rule of SUBJECT_RULES) {
    if (rule.regex.test(headerSlice)) {
      return rule.label;
    }
  }

  return null;
}

/**
 * Identifica a Matéria final da questão de forma inteligente.
 */
export function getQuestionSubject(q: Question): string {
  // 1. Se tem matéria associada na tabela que não seja genérica ("Geral", "Gerais")
  if (q.subjectNome && !GENERIC_NAMES.has(q.subjectNome.trim().toLowerCase())) {
    return q.subjectNome.trim();
  }

  // 2. Tenta detectar pelo texto do enunciado
  const detected = detectSubjectFromText(q.enunciado);
  if (detected) {
    return detected;
  }

  // 3. Se o tópico tiver um nome específico
  if (q.topicNome && !GENERIC_NAMES.has(q.topicNome.trim().toLowerCase())) {
    return q.topicNome.trim();
  }

  // 4. Se a matéria era "Gerais" ou similar, retorna "Geral"
  return q.subjectNome?.trim() || "Geral";
}

export interface ClassifiedQuestion {
  raw: Question;
  numero: number;
  subject: string;
}

/**
 * Classifica uma lista de questões com número e matéria normalizados.
 */
export function classifyQuestions(questions: Question[]): ClassifiedQuestion[] {
  return questions.map((q, idx) => ({
    raw: q,
    numero: extractQuestionNumber(q, idx),
    subject: getQuestionSubject(q),
  }));
}
