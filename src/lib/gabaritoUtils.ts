const LETTERS = ["A", "B", "C", "D", "E"];

function normalizeClean(s: string): string {
  return (s ?? "").trim().toLowerCase();
}

function extractSingleLetter(s: string): string | null {
  const clean = normalizeClean(s).replace(/[.):\-\s]/g, "");
  if (clean.length === 1 && clean >= "a" && clean <= "e") {
    return clean.toUpperCase();
  }
  return null;
}

export function isGabaritoMatch(
  optionOrLetter: string | null | undefined,
  gabarito: string | null | undefined,
  alternativas: string[] = [],
): boolean {
  if (!optionOrLetter || !gabarito) return false;

  const opt = normalizeClean(optionOrLetter);
  const gab = normalizeClean(gabarito);

  if (opt === gab) return true;

  const optLetter = extractSingleLetter(opt);
  const gabLetter = extractSingleLetter(gab);

  if (optLetter && gabLetter && optLetter === gabLetter) {
    return true;
  }

  if (gabLetter) {
    const targetIndex = LETTERS.indexOf(gabLetter);
    if (targetIndex >= 0 && alternativas[targetIndex]) {
      if (normalizeClean(alternativas[targetIndex]) === opt) return true;

      const altWithoutPrefix = alternativas[targetIndex].replace(/^[a-eA-E][.):\-\s]\s*/, "").trim().toLowerCase();
      const optWithoutPrefix = opt.replace(/^[a-eA-E][.):\-\s]\s*/, "").trim().toLowerCase();
      if (altWithoutPrefix && altWithoutPrefix === optWithoutPrefix) return true;
    }
  }

  if (optLetter) {
    const optIndex = LETTERS.indexOf(optLetter);
    if (optIndex >= 0 && alternativas[optIndex]) {
      if (normalizeClean(alternativas[optIndex]) === gab) return true;
      const altWithoutPrefix = alternativas[optIndex].replace(/^[a-eA-E][.):\-\s]\s*/, "").trim().toLowerCase();
      const gabWithoutPrefix = gab.replace(/^[a-eA-E][.):\-\s]\s*/, "").trim().toLowerCase();
      if (altWithoutPrefix && altWithoutPrefix === gabWithoutPrefix) return true;
    }
  }

  const stripPrefix = (str: string) => str.replace(/^[a-eA-E][.):\-\s]\s*/, "").trim().toLowerCase();
  const strippedOpt = stripPrefix(opt);
  const strippedGab = stripPrefix(gab);
  if (strippedOpt && strippedGab && strippedOpt === strippedGab) {
    return true;
  }

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
