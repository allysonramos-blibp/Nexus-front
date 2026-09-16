import { useEffect } from "react";
import { Bot, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAiChat } from "@/contexts/AiChatContext";
import { Button } from "@/components/ui/Button";

export default function IaPage() {
  const { openChat, isOpen } = useAiChat();

  useEffect(() => {
    if (!isOpen) {
      openChat();
    }
  }, [isOpen, openChat]);

  return (
    <AppShell title="Tutor IA" subtitle="Assistente Nexus">
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="size-16 rounded-2xl bg-study/15 text-study flex items-center justify-center mb-4">
          <Bot className="size-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Tutor de Estudos & Produtividade</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          Agora a IA do Nexus funciona em formato de popup flutuante em qualquer tela do sistema, permitindo que você tire dúvidas sem perder o contexto do que está fazendo!
        </p>

        <Button
          onClick={() => openChat()}
          className="mt-6 bg-study hover:bg-study/90 text-white"
        >
          <Sparkles className="size-4 mr-2" /> Abrir Tutor IA no Popup
        </Button>
      </div>
    </AppShell>
  );
}
