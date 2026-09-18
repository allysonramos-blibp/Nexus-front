import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { api, type ChatMessage } from "@/lib/api";
import {
  getCustomGeminiKey,
  setCustomGeminiKey,
  askGeminiDirect
} from "@/lib/geminiDirectService";

interface AiChatContextValue {
  isOpen: boolean;
  openChat: (initialMessage?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
  history: ChatMessage[];
  sendMessage: (msg: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  clearHistory: () => void;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  customApiKey: string;
  updateCustomApiKey: (key: string) => void;
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

const STORAGE_KEY = "nexus.ai_chat_history";

export function AiChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customApiKey, setCustomApiKeyState] = useState<string>(() => getCustomGeminiKey() || "");
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {

    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-30)));
    } catch {

    }
  }, [history]);

  const updateCustomApiKey = (key: string) => {
    setCustomGeminiKey(key);
    setCustomApiKeyState(key.trim());
    setError(null);
  };

  const openChat = (initialMessage?: string) => {
    setIsOpen(true);
    setUnreadCount(0);
    if (initialMessage && initialMessage.trim()) {
      sendMessage(initialMessage.trim());
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const toggleChat = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) setUnreadCount(0);
      return next;
    });
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {

    }
  };

  const performChatRequest = async (prompt: string, contextHistory: ChatMessage[]): Promise<string> => {
    if (customApiKey && customApiKey.trim()) {
      return await askGeminiDirect(prompt, contextHistory, customApiKey.trim());
    }

    try {
      const res = await api.chat(prompt, contextHistory);
      return res.reply;
    } catch (backendErr: any) {
      const msg = backendErr?.message || "";
      const status = backendErr?.status;
      if (status === 429 || msg.includes("quota") || msg.includes("limite")) {
        throw new Error(
          "O limite da IA compartilhada do servidor foi atingido temporariamente. Você pode inserir sua chave gratuita do Google (sem pagar nada) nas configurações da IA acima para ter 1.500 mensagens livres todos os dias."
        );
      }
      throw backendErr;
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    setError(null);

    const text = content.trim();
    const userMsg: ChatMessage = { role: "user", content: text };

    let currentHistory = [...history];
    if (currentHistory.length > 0 && currentHistory[currentHistory.length - 1].role === "user" && currentHistory[currentHistory.length - 1].content === text) {

    } else {
      currentHistory = [...currentHistory, userMsg];
      setHistory(currentHistory);
    }

    setIsLoading(true);

    try {

      const previousMessages = currentHistory.slice(0, -1);
      const reply = await performChatRequest(text, previousMessages);

      setHistory([...currentHistory, { role: "assistant", content: reply }]);
      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } catch (err: any) {
      const msg = err?.message || (typeof err === "string" ? err : "");
      if (err?.status === 401 || msg.includes("Token") || msg.includes("autenticado")) {
        setError("Sua sessão expirou. Faça login novamente para continuar.");
      } else if (msg) {
        setError(msg);
      } else {
        setError("Erro ao se comunicar com a IA. Tente novamente em instantes.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = async () => {
    if (isLoading || history.length === 0) return;
    const lastMsg = history[history.length - 1];
    if (lastMsg.role !== "user") return;

    setError(null);
    setIsLoading(true);

    try {
      const previousMessages = history.slice(0, -1);
      const reply = await performChatRequest(lastMsg.content, previousMessages);

      setHistory([...history, { role: "assistant", content: reply }]);
      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } catch (err: any) {
      const msg = err?.message || (typeof err === "string" ? err : "");
      if (err?.status === 401 || msg.includes("Token") || msg.includes("autenticado")) {
        setError("Sua sessão expirou. Faça login novamente para continuar.");
      } else if (msg) {
        setError(msg);
      } else {
        setError("Erro ao se comunicar com a IA. Tente novamente em instantes.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AiChatContext.Provider
      value={{
        isOpen,
        openChat,
        closeChat,
        toggleChat,
        history,
        sendMessage,
        retryLastMessage,
        clearHistory,
        isLoading,
        error,
        unreadCount,
        customApiKey,
        updateCustomApiKey,
      }}
    >
      {children}
    </AiChatContext.Provider>
  );
}

export function useAiChat() {
  const ctx = useContext(AiChatContext);
  if (!ctx) {
    throw new Error("useAiChat deve ser usado dentro de um AiChatProvider");
  }
  return ctx;
}
