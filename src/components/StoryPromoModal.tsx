import { useState, useRef } from "react";
import { X, Download, Share2, Sparkles, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoryPromoModal({ isOpen, onClose }: StoryModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownloadPng = () => {
    setDownloading(true);
    try {
      const svgElement = svgContainerRef.current?.querySelector("svg");
      if (!svgElement) return;

      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1080;
        canvas.height = 1920;
        const context = canvas.getContext("2d");
        if (context) {
          context.drawImage(image, 0, 0, 1080, 1920);
          const pngUrl = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = "Nexus_Story_1080x1920.png";
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        URL.revokeObjectURL(blobURL);
        setDownloading(false);
      };
      image.src = blobURL;
    } catch (e) {
      console.error(e);
      // Fallback para baixar SVG direto
      const a = document.createElement("a");
      a.href = "/nexus_story.svg";
      a.download = "Nexus_Story_1080x1920.svg";
      a.click();
      setDownloading(false);
    }
  };

  const handleCopyStoryText = () => {
    const text = `🔥 Acabei de conhecer o NEXUS: o app definitivo para quem estuda para concursos, treina pesado e cuida do dinheiro no mesmo lugar!\n\n📚 Concursos & FSRS\n⚡ Treinos & Cargas\n💰 Finanças em Tempo Real\n✨ IA Integrada\n\nAcesse: https://nexus-front-phi.vercel.app`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border/80 bg-surface p-5 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-dash/15 text-dash">
              <Sparkles className="size-4" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Imagem para Story do Instagram (9:16)
              </h2>
              <p className="text-xs text-muted-foreground">
                Design oficial em alta resolução (1080x1920) pronto para postar
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-raised hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Visualizador do Story */}
        <div className="my-4 flex flex-col items-center justify-center gap-4">
          <div
            ref={svgContainerRef}
            className="relative w-full max-w-[280px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border border-border/80 bg-black flex items-center justify-center"
          >
            <img
              src="/nexus_story.svg"
              alt="Nexus Story Preview"
              className="w-full h-full object-contain"
            />
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-md">
            Clique no botão abaixo para baixar em formato <strong>PNG (1080x1920)</strong> com nitidez total para seus Stories do Instagram ou WhatsApp Status.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-border/60">
          <Button
            onClick={handleDownloadPng}
            disabled={downloading}
            className="w-full text-xs font-semibold gap-2 bg-dash hover:bg-dash/90 text-white py-2.5"
          >
            <Download className="size-4" />
            {downloading ? "Renderizando PNG..." : "Baixar Imagem PNG (1080x1920)"}
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
