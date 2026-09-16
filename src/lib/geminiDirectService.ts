/**
 * Serviço de Inteligência Artificial para o Nexus.
 * Permite usar a chave gratuita do Google AI Studio (Gemini Flash)
 * com 15 requisições por minuto e até 1.500 requisições por dia 100% gratuitas,
 * sem precisar pagar planos caros.
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

  // Chamada para a API oficial do Google Gemini Flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1200,
      },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody?.error?.message || `Erro ${res.status} no Gemini`;
    if (res.status === 429) {
      throw new Error("Limite momentâneo da sua chave atingido no Google. Aguarde cerca de 30 segundos.");
    }
    if (res.status === 400 || res.status === 403) {
      throw new Error("Chave do Google Gemini inválida. Verifique sua chave no Google AI Studio.");
    }
    throw new Error(message);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("A IA não retornou resposta. Tente reformular a pergunta.");
  }

  return text;
}
