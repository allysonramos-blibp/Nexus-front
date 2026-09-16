import type { QuestionRequest, QuestionDifficulty } from "@/lib/api";

const LETTERS = ["A", "B", "C", "D", "E"];

export function parseRawQuestionText(raw: string): QuestionRequest[] {
  if (!raw || !raw.trim()) return [];

  // Normalizar quebras de linha
  const normalized = raw.replace(/\r\n/g, "\n").trim();

  // Tentar identificar se há múltiplos blocos de questões
  // Padrões de separação: linha com traços (---), "Questão X", ou número no início seguido de banca
  const questionSeparators = [
    /\n\s*(?:[-=_*]{3,})\s*\n/g,
    /\n(?=(?:Quest[ãa]o\s*\d+|\b\d+\s*[\.\-\)])\s*[\:\.\-]?\s*(?:\([A-Za-z]|\b[A-Z]{3,}))/gi,
  ];

  let rawBlocks = [normalized];
  for (const sep of questionSeparators) {
    const parts = normalized.split(sep).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 1) {
      rawBlocks = parts;
      break;
    }
  }

  const results: QuestionRequest[] = [];

  for (const block of rawBlocks) {
    const parsed = parseSingleBlock(block);
    if (parsed && parsed.enunciado.length > 0 && parsed.alternativas.length >= 2) {
      results.push(parsed);
    }
  }

  // Fallback: se os blocos separados não renderam questões válidas, tentar o texto inteiro
  if (results.length === 0) {
    const single = parseSingleBlock(normalized);
    if (single && single.enunciado.length > 0 && single.alternativas.length >= 2) {
      results.push(single);
    }
  }

  return results;
}

function parseSingleBlock(rawText: string): QuestionRequest | null {
  let text = rawText.trim();
  if (!text) return null;

  // 1. Extrair Explicação / Comentário
  let explicacao: string | null = null;
  const expMatch = text.match(
    /(?:Coment[áa]rio|Explica[çc][ãa]o|Justificativa|Fundamenta[çc][ãa]o|Nota)s?[:\s]+([\s\S]+)$/i,
  );
  if (expMatch && expMatch.index != null) {
    explicacao = expMatch[1].trim();
    text = text.slice(0, expMatch.index).trim();
  }

  // 2. Extrair Gabarito explícito
  let gabaritoRaw: string | null = null;
  const gabMatch = text.match(
    /(?:Gabarito|Resposta|Resp\.?|Alternativa\s+Correta)[:\s]+([A-Ea-e]|Certo|Errado|C|E)\b/i,
  );
  if (gabMatch && gabMatch.index != null) {
    gabaritoRaw = gabMatch[1].trim();
    text = text.slice(0, gabMatch.index).trim();
  } else {
    // Procurar por alternativas marcadas com (X) ou [X]
    const markedMatch = text.match(/\(\s*[Xx✓✔]\s*\)\s*(Certo|Errado|[A-Ea-e])\b/i);
    if (markedMatch) {
      gabaritoRaw = markedMatch[1].trim();
    }
  }

  // 3. Extrair Banca e Ano
  let banca: string | null = null;
  let ano: number | null = null;

  const bancaMatch = text.match(
    /\b(CESPE|CEBRASPE|FGV|FCC|VUNESP|CESGRANRIO|AOCP|IBFC|QUADRIX|CONSULPLAN|IADES|FUMARC|FUNDATEC|SELECON|IDECAN)\b/i,
  );
  if (bancaMatch) {
    const b = bancaMatch[1].toUpperCase();
    banca = b === "CESPE" ? "CEBRASPE" : b;
  }

  const anoMatch = text.match(/\b(201\d|202\d)\b/);
  if (anoMatch) {
    ano = parseInt(anoMatch[1], 10);
  }

  // 4. Verificar se é modelo Certo / Errado
  const hasCertoErrado =
    /\b(Certo|Errado)\b/i.test(text) ||
    (gabaritoRaw && ["CERTO", "ERRADO"].includes(gabaritoRaw.toUpperCase()));

  const hasMultipleChoiceLetters = /\n\s*(?:[C-E]\s*[\)\.\-\:]|\([C-E]\))/i.test(text);

  const isCertoErrado = hasCertoErrado && !hasMultipleChoiceLetters;

  let alternativas: string[] = [];
  let enunciado = text;

  if (isCertoErrado) {
    alternativas = ["Certo", "Errado"];
    // Remove linhas redundantes de "( ) Certo" ou "( ) Errado"
    enunciado = enunciado
      .replace(/(?:\(\s*[Xx ]?\s*\)\s*)?(?:Certo|Errado)\b/gi, "")
      .trim();
  } else {
    // Múltipla escolha (A, B, C, D, E)
    const regexAlt = /(?:^|\n)\s*(?:\(?([A-Ea-e])\)|\b([A-Ea-e])[\.\-\:\)])\s+/g;
    const matches: { index: number; letter: string; end: number }[] = [];

    let m: RegExpExecArray | null;
    while ((m = regexAlt.exec(text)) !== null) {
      matches.push({
        index: m.index,
        letter: (m[1] || m[2]).toUpperCase(),
        end: m.index + m[0].length,
      });
    }

    if (matches.length >= 2) {
      enunciado = text.slice(0, matches[0].index).trim();
      for (let i = 0; i < matches.length; i++) {
        const start = matches[i].end;
        const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
        const altText = text.slice(start, end).trim();
        if (altText) {
          alternativas.push(altText);
        }
      }
    }
  }

  // 5. Determinar gabarito real correspondente
  let gabarito = "";
  if (gabaritoRaw) {
    const gUp = gabaritoRaw.toUpperCase();
    if (isCertoErrado) {
      if (gUp === "C" || gUp === "CERTO") gabarito = "Certo";
      else if (gUp === "E" || gUp === "ERRADO") gabarito = "Errado";
    } else {
      const letterIdx = LETTERS.indexOf(gUp);
      if (letterIdx >= 0 && letterIdx < alternativas.length) {
        gabarito = alternativas[letterIdx];
      } else {
        // Tenta achar alternativa correspondente
        const found = alternativas.find((a) => a.trim().toLowerCase() === gabaritoRaw!.toLowerCase());
        if (found) gabarito = found;
      }
    }
  }

  // 6. Limpar enunciado de numerações iniciais (ex: "Questão 1:", "1.")
  enunciado = enunciado
    .replace(/^(?:Quest[ãa]o\s*\d+[\.\:\-]?|\d+[\.\:\-])\s*/i, "")
    .trim();

  // Se não identificou alternativas mas tem enunciado, criar esqueleto para edição rápida
  if (alternativas.length < 2) {
    alternativas = ["Certo", "Errado"];
  }

  return {
    enunciado,
    alternativas,
    gabarito: gabarito || alternativas[0] || "",
    explicacao: explicacao || null,
    banca: banca || null,
    ano: ano || null,
    dificuldade: ("MEDIA" as QuestionDifficulty),
  };
}
