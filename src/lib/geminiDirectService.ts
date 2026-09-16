/**
 * Serviço de Inteligência Artificial para o Nexus.
 * Permite usar a chave gratuita do Google AI Studio (Gemini)
 * com cota diária gratuita e fallback automático entre modelos estáveis.
 */

const GEMINI_USER_KEY_STORAGE = "nexus_custom_gemini_api_key";

export function getCustomGeminiKey(): string | null {
  try {
    return localStorage.getItem(GEMINI_USER_KEY_STORAGE) || null;
  } catch {
    return null;
  }
}

export function setCustomGeminiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(GEMINI_USER_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(GEMINI_USER_KEY_STORAGE);
    }
  } catch (err) {
    console.error("Erro ao salvar chave customizada do Gemini", err);
  }
}

// Lista de modelos e versões para fallback automático e máxima compatibilidade
const MODEL_CANDIDATES = [
  { version: "v1beta", model: "gemini-2.0-flash" },
  { version: "v1beta", model: "gemini-2.0-flash-lite" },
  { version: "v1", model: "gemini-1.5-flash" },
  { version: "v1beta", model: "gemini-1.5-flash-latest" },
  { version: "v1beta", model: "gemini-pro" },
];

export async function askGeminiDirect(
  prompt: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  apiKey: string
): Promise<string> {
  const contents = [
    ...history.slice(-8).map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }],
    })),
    {
      role: "user",
      parts: [
        {
          text: `Você é o Tutor Inteligente do Nexus (preparatório para concursos e estudos de alto rendimento). 
Responda de forma didática, clara, com exemplos práticos, mnemônicos e foco na retenção do aluno. 
Se for uma questão de concurso, explique a regra jurídica/conceitual, a pegadinha e por que cada alternativa está certa ou errada.

Pergunta do aluno:
${prompt}`,
        },
      ],
    },
  ];

  const body = JSON.stringify({
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1200,
    },
  });

  const cleanKey = apiKey.trim();
  let lastErrorMessage = "";

  // Tenta em sequência os modelos compatíveis com a chave
  for (const candidate of MODEL_CANDIDATES) {
    const url = `https://generativelanguage.googleapis.com/${candidate.version}/models/${candidate.model}:generateContent?key=${cleanKey}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }

      const errData = await res.json().catch(() => ({}));
      const msg = errData?.error?.message || `Status ${res.status}`;
      lastErrorMessage = msg;

      // Se for erro de autenticação ou quota, não adianta tentar outro modelo
      if (res.status === 400 && (msg.includes("API key not valid") || msg.includes("INVALID_ARGUMENT"))) {
        throw new Error("Chave do Google Gemini inválida. Verifique se copiou a chave completa do Google AI Studio.");
      }
      if (res.status === 429) {
        throw new Error("Limite de requisições momentâneo atingido. Aguarde cerca de 30 segundos.");
      }

      // Se for "not found" ou "not supported", continua o loop para o próximo modelo
      console.warn(`Modelo ${candidate.model} falhou: ${msg}. Tentando próximo...`);
    } catch (e: any) {
      if (e.message && (e.message.includes("inválida") || e.message.includes("Limite"))) {
        throw e;
      }
      lastErrorMessage = e.message || lastErrorMessage;
    }
  }

  throw new Error(
    lastErrorMessage || "Não foi possível obter resposta da IA. Verifique sua chave de API do Google AI Studio."
  );
}
