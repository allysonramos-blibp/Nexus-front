/**
 * Serviço de Inteligência Artificial para o Nexus.
 * Consulta dinamicamente os modelos suportados pela chave do usuário no Google AI Studio
 * e executa a geração de conteúdo de forma 100% resiliente.
 */

const GEMINI_USER_KEY_STORAGE = "nexus_custom_gemini_api_key";
const CACHED_MODEL_STORAGE = "nexus_cached_gemini_model";

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
      // Limpa cache de modelo para redescobrir com a nova chave
      localStorage.removeItem(CACHED_MODEL_STORAGE);
    } else {
      localStorage.removeItem(GEMINI_USER_KEY_STORAGE);
      localStorage.removeItem(CACHED_MODEL_STORAGE);
    }
  } catch (err) {
    console.error("Erro ao salvar chave customizada do Gemini", err);
  }
}

/**
 * Consulta a lista oficial de modelos habilitados para a chave informada
 * retornada pelo próprio Google AI Studio (ModelService.ListModels).
 */
async function discoverSupportedModel(apiKey: string): Promise<string> {
  const cached = localStorage.getItem(CACHED_MODEL_STORAGE);
  if (cached) {
    return cached;
  }

  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
  const res = await fetch(listUrl);

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const msg = errData?.error?.message || `Erro ${res.status} ao consultar modelos`;
    if (res.status === 400 || res.status === 403) {
      throw new Error("Chave de API do Google inválida. Verifique se copiou a chave completa gerada no Google AI Studio.");
    }
    throw new Error(msg);
  }

  const data = await res.json();
  const models = (data?.models || []) as Array<{
    name: string;
    supportedGenerationMethods?: string[];
  }>;

  // Filtra apenas modelos que suportam 'generateContent'
  const compatible = models.filter((m) =>
    m.supportedGenerationMethods?.includes("generateContent")
  );

  if (!compatible.length) {
    throw new Error("Nenhum modelo de geração de texto foi encontrado para esta chave no Google.");
  }

  // Prioriza modelos rápidos e modernos (Flash)
  const preferredOrder = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-flash",
  ];

  let chosenModelName = "";
  for (const pref of preferredOrder) {
    const found = compatible.find((m) => m.name.toLowerCase().includes(pref));
    if (found) {
      chosenModelName = found.name; // ex: "models/gemini-2.0-flash" ou "models/gemini-1.5-flash"
      break;
    }
  }

  if (!chosenModelName) {
    chosenModelName = compatible[0].name;
  }

  try {
    localStorage.setItem(CACHED_MODEL_STORAGE, chosenModelName);
  } catch {
    // ignore
  }

  return chosenModelName;
}

export async function askGeminiDirect(
  prompt: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  apiKey: string
): Promise<string> {
  const cleanKey = apiKey.trim();

  // 1. Descobre o modelo exatamente suportado pela chave
  let modelName = await discoverSupportedModel(cleanKey);

  // Garante o formato correto: se tiver "models/", usa direto no endpoint
  // https://generativelanguage.googleapis.com/v1beta/{modelName}:generateContent
  if (!modelName.startsWith("models/")) {
    modelName = `models/${modelName}`;
  }

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

  const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${cleanKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody?.error?.message || `Erro ${res.status} no Gemini`;

    // Se o modelo em cache der erro, invalida o cache
    try {
      localStorage.removeItem(CACHED_MODEL_STORAGE);
    } catch {
      // ignore
    }

    if (res.status === 429) {
      throw new Error("Limite de requisições por minuto atingido. Aguarde cerca de 30 segundos.");
    }
    if (res.status === 400 || res.status === 403) {
      throw new Error("Chave do Google Gemini inválida ou sem permissão para este projeto.");
    }

    throw new Error(message);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("A IA não retornou resposta. Tente reenviar.");
  }

  return text;
}
