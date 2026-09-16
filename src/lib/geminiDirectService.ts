/**
 * Serviço de Inteligência Artificial para o Nexus.
 * Suporta chave gratuita do Google AI Studio com:
 * 1. Descoberta dinâmica de modelos disponíveis
 * 2. Alternância automática imediata quando um modelo estiver em alta demanda (503 / high demand)
 * 3. Fallback inteligente entre Gemini 2.0 Flash, Gemini 1.5 Flash, Gemini Lite e Flash-8B
 */

const GEMINI_USER_KEY_STORAGE = "nexus_custom_gemini_api_key";
const ACTIVE_MODEL_STORAGE = "nexus_active_gemini_model";
const MODELS_LIST_STORAGE = "nexus_cached_gemini_models_list";

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
      localStorage.removeItem(ACTIVE_MODEL_STORAGE);
      localStorage.removeItem(MODELS_LIST_STORAGE);
    } else {
      localStorage.removeItem(GEMINI_USER_KEY_STORAGE);
      localStorage.removeItem(ACTIVE_MODEL_STORAGE);
      localStorage.removeItem(MODELS_LIST_STORAGE);
    }
  } catch (err) {
    console.error("Erro ao salvar chave customizada do Gemini", err);
  }
}

const DEFAULT_FALLBACK_MODELS = [
  "models/gemini-2.0-flash",
  "models/gemini-1.5-flash",
  "models/gemini-2.0-flash-lite",
  "models/gemini-1.5-flash-8b",
  "models/gemini-2.5-flash",
  "models/gemini-1.5-pro",
];

/**
 * Consulta a lista oficial de modelos habilitados para a chave do usuário no Google AI Studio.
 */
async function discoverCompatibleModels(apiKey: string): Promise<string[]> {
  try {
    const cached = localStorage.getItem(MODELS_LIST_STORAGE);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
    const res = await fetch(listUrl);

    if (res.ok) {
      const data = await res.json();
      const models = (data?.models || []) as Array<{
        name: string;
        supportedGenerationMethods?: string[];
      }>;

      const compatible = models.filter((m) =>
        m.supportedGenerationMethods?.includes("generateContent")
      );

      if (compatible.length > 0) {
        // Ordena por velocidade e estabilidade preferida
        const priorityScore = (name: string): number => {
          const n = name.toLowerCase();
          if (n.includes("gemini-2.0-flash-lite")) return 1;
          if (n.includes("gemini-1.5-flash-8b")) return 2;
          if (n.includes("gemini-1.5-flash")) return 3;
          if (n.includes("gemini-2.0-flash")) return 4;
          if (n.includes("gemini-2.5-flash")) return 5;
          if (n.includes("gemini-1.5-pro")) return 6;
          return 10;
        };

        const sorted = compatible
          .map((m) => m.name.startsWith("models/") ? m.name : `models/${m.name}`)
          .sort((a, b) => priorityScore(a) - priorityScore(b));

        try {
          localStorage.setItem(MODELS_LIST_STORAGE, JSON.stringify(sorted));
        } catch {
          // ignore
        }

        return sorted;
      }
    }
  } catch (e) {
    console.warn("Não foi possível listar modelos dinamicamente, usando fallback.", e);
  }

  return DEFAULT_FALLBACK_MODELS;
}

export async function askGeminiDirect(
  prompt: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  apiKey: string
): Promise<string> {
  const cleanKey = apiKey.trim();

  // Obtém modelos compatíveis
  let candidateModels = await discoverCompatibleModels(cleanKey);

  // Se houver um modelo que funcionou recentemente com sucesso, tenta ele primeiro
  const lastActive = localStorage.getItem(ACTIVE_MODEL_STORAGE);
  if (lastActive && candidateModels.includes(lastActive)) {
    candidateModels = [lastActive, ...candidateModels.filter((m) => m !== lastActive)];
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

  let lastErrorMsg = "";

  // Tenta em sequência os modelos. Se um der erro de demanda/503/429, pula para o próximo instantaneamente!
  for (let attempt = 0; attempt < candidateModels.length; attempt++) {
    const modelName = candidateModels[attempt];
    const cleanModelName = modelName.startsWith("models/") ? modelName : `models/${modelName}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/${cleanModelName}:generateContent?key=${cleanKey}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          // Salva como modelo ativo padrão para agilizar próximas perguntas
          try {
            localStorage.setItem(ACTIVE_MODEL_STORAGE, cleanModelName);
          } catch {
            // ignore
          }
          return text;
        }
      }

      const errorBody = await res.json().catch(() => ({}));
      const msg = errorBody?.error?.message || `Erro ${res.status}`;
      lastErrorMsg = msg;

      // Erro fatal de autenticação: a chave em si está errada
      if (res.status === 400 && (msg.includes("API key not valid") || msg.includes("INVALID_ARGUMENT"))) {
        throw new Error("Chave do Google Gemini inválida. Verifique se copiou a chave completa gerada no Google AI Studio.");
      }

      const isOverloadedOrDemand =
        res.status === 503 ||
        res.status === 429 ||
        msg.toLowerCase().includes("demand") ||
        msg.toLowerCase().includes("overloaded") ||
        msg.toLowerCase().includes("resource_exhausted") ||
        msg.toLowerCase().includes("spikes in demand");

      if (isOverloadedOrDemand) {
        console.warn(`[Gemini] ${cleanModelName} com alta demanda ou limite. Alternando automaticamente para o próximo modelo...`);
        continue;
      }

      // Se for modelo não encontrado ou não suportado, segue para o próximo
      if (res.status === 404 || msg.toLowerCase().includes("not found") || msg.toLowerCase().includes("not supported")) {
        continue;
      }
    } catch (e: any) {
      if (e.message && e.message.includes("inválida")) {
        throw e;
      }
      lastErrorMsg = e.message || lastErrorMsg;
    }
  }

  // Se todos os modelos retornaram alta demanda:
  if (
    lastErrorMsg.toLowerCase().includes("demand") ||
    lastErrorMsg.toLowerCase().includes("overloaded") ||
    lastErrorMsg.toLowerCase().includes("503")
  ) {
    throw new Error(
      "Os servidores do Google estão com alta demanda temporária neste exato momento. Tentamos alternar entre os modelos Flash e Lite automaticamente. Aguarde 15 a 30 segundos e clique em 'Tentar novamente'."
    );
  }

  throw new Error(
    lastErrorMsg || "Não foi possível obter resposta da IA. Tente novamente em instantes."
  );
}
