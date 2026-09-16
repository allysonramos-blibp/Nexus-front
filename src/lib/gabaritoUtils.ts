const LETTERS = ["A", "B", "C", "D", "E"];

/**
 * Normaliza qualquer texto de opção ou gabarito para comparação robusta.
 */
function normalizeClean(s: string): string {
  return (s ?? "").trim().toLowerCase();
}

/**
 * Extrai apenas a letra se for uma opção única como 'A', 'b', 'C)', 'd.', etc.
 */
function extractSingleLetter(s: string): string | null {
  const clean = normalizeClean(s).replace(/[.):\-\s]/g, "");
  if (clean.length === 1 && clean >= "a" && clean <= "e") {
    return clean.toUpperCase();
  }
  return null;
}

/**
 * Verifica se a opção/alternativa corresponde ao gabarito, lidando com:
 * 1. Gabarito gravado como letra ('C') e usuário clicando no texto da alternativa (ou vice-versa)
 * 2. Prefixos de alternativa, ex: 'C) Texto da alternativa' vs 'Texto da alternativa'
 * 3. Questões Certo/Errado (ex: 'C' vs 'Certo', 'E' vs 'Errado')
 * 4. Espaços, maiúsculas/minúsculas e pontuações
 */
export function isGabaritoMatch(
  optionOrLetter: string | null | undefined,
  gabarito: string | null | undefined,
  alternativas: string[] = [],
): boolean {
  if (!optionOrLetter || !gabarito) return false;

  const opt = normalizeClean(optionOrLetter);
  const gab = normalizeClean(gabarito);

  // 1. Igualdade direta
  if (opt === gab) return true;

  // 2. Extrair letras
  const optLetter = extractSingleLetter(opt);
  const gabLetter = extractSingleLetter(gab);

  // Se ambos forem letras (ex: 'C' e 'c)')
  if (optLetter && gabLetter && optLetter === gabLetter) {
    return true;
  }

  // Se o gabarito é apenas a letra (ex: 'C') e o usuário selecionou o texto completo da alternativa C
  if (gabLetter) {
    const targetIndex = LETTERS.indexOf(gabLetter);
    if (targetIndex >= 0 && alternativas[targetIndex]) {
      if (normalizeClean(alternativas[targetIndex]) === opt) return true;
      // Com ou sem prefixo de letra
      const altWithoutPrefix = alternativas[targetIndex].replace(/^[a-eA-E][.):\-\s]\s*/, "").trim().toLowerCase();
      const optWithoutPrefix = opt.replace(/^[a-eA-E][.):\-\s]\s*/, "").trim().toLowerCase();
      if (altWithoutPrefix && altWithoutPrefix === optWithoutPrefix) return true;
    }
  }

  // Se a opção informada é uma letra (ex: 'C') e o gabarito é o texto completo
  if (optLetter) {
    const optIndex = LETTERS.indexOf(optLetter);
    if (optIndex >= 0 && alternativas[optIndex]) {
      if (normalizeClean(alternativas[optIndex]) === gab) return true;
      const altWithoutPrefix = alternativas[optIndex].replace(/^[a-eA-E][.):\-\s]\s*/, "").trim().toLowerCase();
      const gabWithoutPrefix = gab.replace(/^[a-eA-E][.):\-\s]\s*/, "").trim().toLowerCase();
      if (altWithoutPrefix && altWithoutPrefix === gabWithoutPrefix) return true;
    }
  }

  // 3. Comparação removendo prefixos de letra ("A) ...", "B. ...")
  const stripPrefix = (str: string) => str.replace(/^[a-eA-E][.):\-\s]\s*/, "").trim().toLowerCase();
  const strippedOpt = stripPrefix(opt);
  const strippedGab = stripPrefix(gab);
  if (strippedOpt && strippedGab && strippedOpt === strippedGab) {
    return true;
  }

  // 4. Questões de Certo / Errado do Cebraspe
  const isCerto = (s: string) => {
    const c = s.replace(/[.):\-\s]/g, "");
    return c === "c" || c === "certo" || c === "correto" || c === "v" || c === "verdadeiro";
  };
  const isErrado = (s: string) => {
    const c = s.replace(/[.):\-\s]/g, "");
    return c === "e" || c === "errado" || c === "incorreto" || c === "f" || c === "falso";
  };

  if (isCerto(opt) && isCerto(gab)) return true;
  if (isErrado(opt) && isErrado(gab)) return true;

  return false;
}

/**
 * Retorna o texto formatado e limpo do gabarito para exibição ao usuário.
 * Se o gabarito for apenas a letra 'C', exibe 'C - [Texto da alternativa C]'
 * Se o gabarito for o texto, localiza a letra correspondente (ex: 'C - [Texto]').
 */
export function formatGabaritoDisplay(
  gabarito: string | null | undefined,
  alternativas: string[] = [],
): string {
  if (!gabarito) return "(não informado)";

  const gabLetter = extractSingleLetter(gabarito);
  if (gabLetter) {
    const idx = LETTERS.indexOf(gabLetter);
    if (idx >= 0 && alternativas[idx]) {
      const altText = alternativas[idx].replace(/^[a-eA-E][.):\-\s]\s*/, "").trim();
      return `${gabLetter}) ${altText}`;
    }
    return gabLetter;
  }

  // Se o gabarito é o texto da alternativa, acha qual é a letra
  for (let i = 0; i < alternativas.length; i++) {
    if (isGabaritoMatch(alternativas[i], gabarito, alternativas)) {
      const altText = alternativas[i].replace(/^[a-eA-E][.):\-\s]\s*/, "").trim();
      return `${LETTERS[i]}) ${altText}`;
    }
  }

  return gabarito;
}
