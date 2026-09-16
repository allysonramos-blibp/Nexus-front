import { useState } from "react";
import { X, Download, Sparkles, Check, Copy, ExternalLink, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoryPromoModal({ isOpen, onClose }: StoryModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleDownloadPng = async () => {
    setDownloading(true);
    try {
      // Faz fetch do arquivo PNG real 1080x1920 já compilado
      const res = await fetch("/nexus_story.png", { cache: "no-cache" });
      if (!res.ok) throw new Error("Erro ao carregar PNG");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Nexus_Story_1080x1920.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Falha ao baixar via Blob, redirecionando:", err);
      // Fallback direto via tag âncora
      const a = document.createElement("a");
      a.href = "/nexus_story.png";
      a.download = "Nexus_Story_1080x1920.png";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyStoryText = () => {
    const text = `🔥 Acabei de conhecer o NEXUS: o app definitivo para quem estuda para concursos, treina musculação e cuida das finanças no mesmo lugar!\n\n📚 Concursos & FSRS\n⚡ Treinos & Cargas\n💰 Finanças em Tempo Real\n✨ IA Integrada\n\nAcesse agora: https://nexus-front-phi.vercel.app`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-border/80 bg-surface p-5 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-dash/15 text-dash">
              <Smartphone className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Imagem para Story do Instagram (9:16)
              </h2>
              <p className="text-xs text-muted-foreground">
                Resolução nativa 1080x1920 pixels • Pronta para Stories e Status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-raised hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Visualizador da Imagem Real PNG */}
        <div className="my-4 flex flex-col items-center justify-center gap-3">
          <div className="relative w-full max-w-[260px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-border/80 bg-black flex items-center justify-center group">
            <img
              src="/nexus_story.png"
              alt="Nexus Story 1080x1920"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <span className="text-xs font-semibold text-white bg-black/70 px-3 py-1.5 rounded-full border border-white/20">
                1080 x 1920 PNG
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground text-center">
            <span>✨ Fundo Dark Slate, Tipografia Neon e Módulos Nexus</span>
            <span>•</span>
            <a
              href="/nexus_story.png"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-dash hover:underline font-semibold"
            >
              Abrir original em tela cheia <ExternalLink className="size-3" />
            </a>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-border/60">
          <Button
            onClick={handleDownloadPng}
            disabled={downloading}
            className="w-full text-xs font-semibold gap-2 bg-dash hover:bg-dash/90 text-white py-2.5"
          >
            <Download className="size-4" />
            {downloading ? "Baixando..." : "Baixar PNG (1080x1920)"}
          </Button>

          <Button
            onClick={handleCopyStoryText}
            variant="outline"
            className="w-full text-xs font-semibold gap-2 border-border py-2.5"
          >
            {copiedLink ? (
              <Check className="size-4 text-emerald-400" />
            ) : (
              <Copy className="size-4 text-muted-foreground" />
            )}
            {copiedLink ? "Legenda Copiada!" : "Copiar Legenda Pronta"}
          </Button>
        </div>
      </div>
    </div>
  );
}
