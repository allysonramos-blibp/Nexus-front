import { useState } from "react";
import { Download, Share, PlusSquare, X, Check } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/Button";

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstallable) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleInstall}
        disabled={isInstalling}
        className="border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs gap-1.5 transition-all shadow-sm"
      >
        <Download className="size-3.5" />
        Instalar App
      </Button>
    );
  }

  if (isIOS) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowIOSGuide(true)}
          className="border-primary/40 bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs gap-1.5 transition-all shadow-sm"
        >
          <Download className="size-3.5" />
          Instalar no iPhone
        </Button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Download className="size-4 text-primary" /> Como instalar no iPhone
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/70 bg-surface-raised/40">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold">
                    1
                  </span>
                  <div>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      Toque em Compartilhar <Share className="size-3.5 text-primary" />
                    </p>
                    <p className="mt-0.5 text-[11px]">
                      No Safari do seu iPhone, toque no botão central de compartilhar na barra inferior.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/70 bg-surface-raised/40">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold">
                    2
                  </span>
                  <div>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      Adicionar à Tela de Início <PlusSquare className="size-3.5 text-primary" />
                    </p>
                    <p className="mt-0.5 text-[11px]">
                      Role a lista de opções para baixo e selecione <strong>Adicionar à Tela de Início</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-border/70 bg-surface-raised/40">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-500 font-bold">
                    3
                  </span>
                  <div>
                    <p className="font-semibold text-foreground flex items-center gap-1.5">
                      Pronto! <Check className="size-3.5 text-emerald-500" />
                    </p>
                    <p className="mt-0.5 text-[11px]">
                      O ícone do Nexus ficará na sua tela inicial como um app nativo, sem barras de navegador.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full text-xs"
              >
                Entendi
              </Button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
