import { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  HelpCircle,
  Save,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/contexts/ToastContext";
import {
  getKiwifyLinks,
  saveKiwifyLinks,
  type KiwifyLinks,
} from "@/lib/kiwifyConfig";

interface AdminKiwifyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminKiwifyModal({ isOpen, onClose }: AdminKiwifyModalProps) {
  const { toast } = useToast();
  const [links, setLinks] = useState<KiwifyLinks>(getKiwifyLinks());
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLinks(getKiwifyLinks());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveKiwifyLinks(links);
    toast("Links da Kiwify salvos com sucesso!", "success");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-border/80 bg-surface p-5 sm:p-7 shadow-2xl my-auto">
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <CreditCard className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                Integração de Vendas & Kiwify
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure os links de checkout para receber pagamentos no cartão e assinatura automática.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <div className="flex items-center justify-between rounded-xl bg-dash/10 border border-dash/20 p-3.5 text-xs text-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-dash shrink-0" />
              <span>
                Cole os links das suas ofertas geradas na Kiwify. Quando o aluno clicar em &quot;Assinar&quot;, ele será direcionado diretamente para a sua página de pagamento.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowTutorial(!showTutorial)}
              className="text-dash font-semibold underline shrink-0 ml-2 hover:opacity-80"
            >
              {showTutorial ? "Ocultar guia" : "Como criar?"}
            </button>
          </div>

          {showTutorial && (
            <div className="rounded-xl border border-border/70 bg-surface-raised/50 p-4 space-y-2 text-xs text-muted-foreground">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <HelpCircle className="size-4 text-emerald-400" /> Passo a Passo na Kiwify:
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>
                  Acesse <strong>kiwify.com.br</strong> e crie ou faça login na sua conta.
                </li>
                <li>
                  No menu lateral, vá em <strong>Produtos</strong> &gt; <strong>Criar Produto</strong>.
                </li>
                <li>
                  Selecione o tipo de pagamento: <strong>Pagamento recorrente (Assinatura)</strong>.
                </li>
                <li>
                  Crie o produto <strong>Nexus Pro</strong> com o valor de R$ 49,90/mês (e opcionalmente a oferta anual de R$ 478,80 ou 12x R$ 39,90).
                </li>
                <li>
                  Vá na aba <strong>Links</strong> do produto, copie o <strong>Link do Checkout</strong> (ex: <code className="text-foreground">https://pay.kiwify.com.br/...</code>) e cole nos campos abaixo.
                </li>
              </ol>
            </div>
          )}

          {/* NEXUS PRO */}
          <div className="rounded-xl border border-dash/40 bg-dash/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-dash" />
                <h3 className="text-sm font-bold text-foreground">Nexus Pro All-in-One (Mais Vendido)</h3>
              </div>
              <span className="text-[11px] font-semibold text-dash uppercase tracking-wider">
                R$ 49,90/mês ou R$ 39,90/ano
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Link2 className="size-3 text-dash" /> Link Kiwify - Mensal:
                </label>
                <Input
                  placeholder="https://pay.kiwify.com.br/..."
                  value={links.proMonthly || ""}
                  onChange={(e) => setLinks({ ...links, proMonthly: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Link2 className="size-3 text-dash" /> Link Kiwify - Anual:
                </label>
                <Input
                  placeholder="https://pay.kiwify.com.br/..."
                  value={links.proYearly || ""}
                  onChange={(e) => setLinks({ ...links, proYearly: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* NEXUS STARTER */}
          <div className="rounded-xl border border-border/70 bg-surface-raised/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-study" />
                <h3 className="text-sm font-bold text-foreground">Nexus Starter (Estudos)</h3>
              </div>
              <span className="text-[11px] font-semibold text-study uppercase tracking-wider">
                R$ 29,90/mês ou R$ 24,90/ano
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Link2 className="size-3 text-study" /> Link Kiwify - Mensal:
                </label>
                <Input
                  placeholder="https://pay.kiwify.com.br/..."
                  value={links.starterMonthly || ""}
                  onChange={(e) => setLinks({ ...links, starterMonthly: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Link2 className="size-3 text-study" /> Link Kiwify - Anual:
                </label>
                <Input
                  placeholder="https://pay.kiwify.com.br/..."
                  value={links.starterYearly || ""}
                  onChange={(e) => setLinks({ ...links, starterYearly: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* NEXUS ENTERPRISE */}
          <div className="rounded-xl border border-border/70 bg-surface-raised/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-2 rounded-full bg-gym" />
                <h3 className="text-sm font-bold text-foreground">Nexus Enterprise / Mentoria</h3>
              </div>
              <span className="text-[11px] font-semibold text-gym uppercase tracking-wider">
                R$ 99,90/mês
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Link2 className="size-3 text-gym" /> Link Kiwify - Mensal:
                </label>
                <Input
                  placeholder="https://pay.kiwify.com.br/..."
                  value={links.enterpriseMonthly || ""}
                  onChange={(e) => setLinks({ ...links, enterpriseMonthly: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Link2 className="size-3 text-gym" /> Link Kiwify - Anual:
                </label>
                <Input
                  placeholder="https://pay.kiwify.com.br/..."
                  value={links.enterpriseYearly || ""}
                  onChange={(e) => setLinks({ ...links, enterpriseYearly: e.target.value })}
                  className="text-xs font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
            <Save className="size-4" /> Salvar Links de Venda
          </Button>
        </div>
      </div>
    </div>
  );
}
