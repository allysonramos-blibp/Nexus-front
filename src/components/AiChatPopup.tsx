import { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  X, 
  Send, 
  User, 
  Sparkles, 
  Trash2, 
  Maximize2, 
  Minimize2, 
  ChevronDown, 
  Key, 
  Check, 
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { useAiChat } from "@/contexts/AiChatContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const SUGGESTIONS = [
  "Como organizar meu ciclo de estudos semanal?",
  "Me explique o que é crase facultativa com exemplos",
  "Dicas mnemônicas para decorar prazos de recursos",
  "Técnicas para combater a procrastinação nos estudos",
];

export function AiChatPopup() {
  const {
    isOpen,
    closeChat,
    history,
    sendMessage,
    retryLastMessage,
    clearHistory,
    isLoading,
    error,
    customApiKey,
    updateCustomApiKey,
  } = useAiChat();

  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfigKey, setShowConfigKey] = useState(false);
  const [tempKey, setTempKey] = useState(customApiKey);
  const [keySavedBadge, setKeySavedBadge] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempKey(customApiKey);
  }, [customApiKey]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 150);
    }
  }, [isOpen, history.length, isLoading]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    sendMessage(msg);
  };

  const handleSaveKey = () => {
    updateCustomApiKey(tempKey);
    setKeySavedBadge(true);
    setTimeout(() => {
      setKeySavedBadge(false);
      setShowConfigKey(false);
    }, 1500);
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-200 flex flex-col shadow-2xl border border-study/30 bg-surface rounded-2xl overflow-hidden backdrop-blur-md ${
        isExpanded
          ? "inset-4 sm:inset-10 md:inset-x-24 md:inset-y-12"
          : "bottom-20 right-4 sm:bottom-6 sm:right-6 w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh]"
      }`}
    >
      {/* Header do Chat */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-study/10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-xl bg-study/20 text-study flex items-center justify-center shrink-0 border border-study/30">
            <Bot className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate flex items-center gap-1.5">
              Nexus Tutor IA
              <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-muted-foreground truncate">
              {customApiKey ? "✨ Usando sua chave gratuita Gemini" : "Assistente de Estudos & Produtividade"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowConfigKey(!showConfigKey)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showConfigKey || customApiKey
                ? "text-study bg-study/15"
                : "text-muted-foreground hover:bg-surface-raised hover:text-foreground"
            }`}
            title="Configurar chave gratuita da IA"
          >
            <Key className="size-4" />
          </button>

          {history.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
              title="Limpar histórico"
            >
              <Trash2 className="size-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer hidden sm:inline-flex"
            title={isExpanded ? "Restaurar tamanho" : "Maximizar"}
          >
            {isExpanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>

          <button
            type="button"
            onClick={closeChat}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors cursor-pointer"
            title="Minimizar chat"
          >
            <ChevronDown className="size-5 sm:hidden" />
            <X className="size-4 hidden sm:inline-block" />
          </button>
        </div>
      </div>

      {/* Painel Expansível de Chave Gratuita Google AI Studio */}
      {showConfigKey && (
        <div className="border-b border-border bg-surface-raised/80 p-3.5 text-xs text-foreground flex flex-col gap-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-study flex items-center gap-1">
              <ShieldCheck className="size-3.5" /> Chave Gratuita do Google Gemini:
            </span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-dash hover:underline flex items-center gap-1"
            >
              Criar chave grátis <ExternalLink className="size-3" />
            </a>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            O Google oferece <strong>1.500 requisições 100% gratuitas por dia</strong>. Colando sua chave aqui, você nunca mais terá bloqueios de limite e não precisará pagar nada.
          </p>
          <div className="flex gap-2 items-center mt-1">
            <Input
              type="password"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="Cole sua chave AIzaSy..."
              className="h-8 text-xs flex-1"
            />
            <Button
              type="button"
              size="sm"
              onClick={handleSaveKey}
              className="h-8 text-xs shrink-0 gap-1 bg-study hover:bg-study/90 text-white"
            >
              {keySavedBadge ? <Check className="size-3.5 text-emerald-400" /> : "Salvar"}
            </Button>
          </div>
        </div>
      )}

      {/* Área de Mensagens */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 scroll-smooth"
      >
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center my-auto py-6 px-3 text-center">
            <div className="size-12 rounded-2xl bg-study/15 text-study flex items-center justify-center mb-3">
              <Sparkles className="size-6" />
            </div>
            <h4 className="text-sm font-semibold text-foreground">Como posso te ajudar agora?</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-xs">
              Tire dúvidas sobre disciplinas, peça explicações sobre questões, resumos ou dicas de foco.
            </p>

            <div className="flex flex-col gap-1.5 w-full mt-4 text-left">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">
                Sugestões rápidas:
              </p>
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(sug)}
                  className="text-xs text-left p-2 rounded-lg border border-border/70 bg-surface-raised/60 hover:bg-study/10 hover:border-study/40 text-foreground transition-colors cursor-pointer"
                >
                  💡 {sug}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${
                isUser ? "flex-row-reverse self-end" : "self-start"
              } max-w-[88%]`}
            >
              <div
                className={`size-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs ${
                  isUser
                    ? "bg-foreground/10 text-foreground"
                    : "bg-study/20 text-study border border-study/30"
                }`}
              >
                {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
              </div>
              <div
                className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  isUser
                    ? "bg-foreground text-background font-medium rounded-tr-sm"
                    : "bg-surface-raised border border-border/80 text-foreground rounded-tl-sm whitespace-pre-line"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5 self-start">
            <div className="size-6 rounded-full bg-study/20 text-study border border-study/30 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="size-3.5" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-surface-raised border border-border/80 px-3.5 py-2.5 text-xs text-muted-foreground flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-study animate-bounce" />
              <span className="size-1.5 rounded-full bg-study animate-bounce [animation-delay:0.15s]" />
              <span className="size-1.5 rounded-full bg-study animate-bounce [animation-delay:0.3s]" />
              <span className="ml-1">Pensando...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive text-center flex flex-col items-center gap-2">
            <p className="leading-relaxed">{error}</p>
            <div className="flex gap-2 items-center mt-1">
              {!customApiKey && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] px-2.5 border-study/50 text-study hover:bg-study/10"
                  onClick={() => setShowConfigKey(true)}
                >
                  <Key className="size-3 mr-1" /> Usar Chave Grátis
                </Button>
              )}
              {history.length > 0 && history[history.length - 1].role === "user" && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-[11px] px-2.5 border-destructive/40 text-destructive hover:bg-destructive/20"
                  onClick={() => {
                    retryLastMessage();
                  }}
                >
                  Tentar novamente
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Input de Mensagem */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-border bg-surface-raised/40 flex items-center gap-2"
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte à IA do Nexus..."
          className="flex-1 h-9 text-xs"
          disabled={isLoading}
        />
        <Button
          type="submit"
          size="sm"
          disabled={isLoading || !input.trim()}
          className="h-9 px-3 bg-study hover:bg-study/90 text-white shrink-0"
        >
          <Send className="size-4" />
        </Button>
      </form>
    </div>
  );
}

export function AiChatFab() {
  const { isOpen, toggleChat, unreadCount } = useAiChat();

  return (
    <button
      type="button"
      onClick={toggleChat}
      aria-label="Abrir tutor de estudos com IA"
      className={`fixed z-40 right-4 sm:right-6 bottom-20 sm:bottom-6 flex items-center gap-2 rounded-full px-4 py-3 shadow-xl transition-all duration-200 cursor-pointer ${
        isOpen
          ? "bg-surface-raised border border-border text-muted-foreground hover:text-foreground scale-90"
          : "bg-gradient-to-r from-study to-indigo-600 text-white hover:scale-105 hover:shadow-study/30"
      }`}
    >
      <div className="relative">
        <Bot className="size-5" />
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </div>
      <span className="text-xs font-semibold hidden sm:inline">
        {isOpen ? "Minimizar IA" : "Tutor IA"}
      </span>
    </button>
  );
}
