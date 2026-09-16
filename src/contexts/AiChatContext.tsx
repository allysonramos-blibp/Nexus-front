import { createContext, useContext, useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";
import { api, type ChatMessage } from "@/lib/api";

interface AiChatContextValue {
  isOpen: boolean;
  openChat: (initialMessage?: string) => void;
  closeChat: () => void;
  toggleChat: () => void;
  history: ChatMessage[];
  sendMessage: (msg: string) => Promise<void>;
  clearHistory: () => void;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
}

const AiChatContext = createContext<AiChatContextValue | null>(null);

const STORAGE_KEY = "nexus.ai_chat_history";

export function AiChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
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
      // ignore
    }
  }, [history]);

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
      // ignore
    }
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    setError(null);
    const userMsg: ChatMessage = { role: "user", content: content.trim() };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setIsLoading(true);

    try {
      const res = await api.chat(content.trim(), history);
      setHistory([...newHistory, { role: "assistant", content: res.reply }]);
      if (!isOpen) {
        setUnreadCount((c) => c + 1);
      }
    } catch (err) {
      setError("Erro ao se comunicar com a IA do Nexus. Tente novamente.");
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
        clearHistory,
        isLoading,
        error,
        unreadCount,
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
