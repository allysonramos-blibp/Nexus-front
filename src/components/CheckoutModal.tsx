import { useState } from "react";
import { 
  X, Check, Sparkles, ShieldCheck, QrCode, CreditCard, 
  Copy, CheckCheck, ExternalLink, Zap, ArrowRight 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/lib/auth";

export interface PlanDetails {
  id: "STARTER" | "PRO" | "ENTERPRISE";
  name: string;
  priceMonthly: number;
  priceYearly: number;
  popular?: boolean;
  description: string;
  features: string[];
  pixKey?: string;
  stripeLink?: string;
}

export const SAAS_PLANS: PlanDetails[] = [
  {
    id: "STARTER",
    name: "Nexus Starter",
    priceMonthly: 29.90,
    priceYearly: 24.90,
    description: "Ideal para concurseiros e estudantes que precisam organizar a rotina com disciplina.",
    features: [
      "Módulo completo de Estudos & Concursos",
      "Banco de Questões e Gabaritos comentados",
      "Simulados com cronômetro e ranking",
      "Caderno de Erros com repetição espaçada",
      "25 extrações de PDF com IA / mês",
      "Central de notificações no navegador e celular (PWA)"
    ]
  },
  {
    id: "PRO",
    name: "Nexus Pro (Mais Vendido)",
    popular: true,
    priceMonthly: 59.90,
    priceYearly: 47.90,
    description: "O ecossistema completo: aprovação em concursos, evolução física e controle de finanças.",
    features: [
      "Tudo do plano Starter incluído",
      "Módulo de Treinos & Fisiologia (progressão de carga)",
      "Módulo de Finanças Pessoais (cartões, despesas, parcelas)",
      "Tutor de IA Flutuante 24h em todas as telas",
      "100 extrações de provas em PDF com IA / mês",
      "Relatório Executivo Oficial em PDF (1-clique)"
    ]
  },
  {
    id: "ENTERPRISE",
    name: "Nexus Vitalício / Mentoria",
    priceMonthly: 129.90,
    priceYearly: 99.90,
    description: "Para quem busca alta performance extrema e mentoria personalizada para cargos de elite.",
    features: [
      "Acesso irrestrito a todos os módulos atuais e futuros",
      "Extrações de PDF Ilimitadas com modelos Gemini Vision",
      "Prioridade máxima na fila de processamento de IA",
      "Suporte VIP via WhatsApp diretamente com o criador",
      "Auditoria individual de plano de estudos e métricas",
      "Badge dourada de Membro Fundador no perfil"
    ]
  }
];

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PlanDetails;
  billingCycle: "MONTHLY" | "YEARLY";
}

export function CheckoutModal({ isOpen, onClose, selectedPlan, billingCycle }: CheckoutModalProps) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"CHECKOUT" | "CONFIRMED">("CHECKOUT");

  if (!isOpen) return null;

  const price = billingCycle === "YEARLY" ? selectedPlan.priceYearly : selectedPlan.priceMonthly;
  const pixKey = "allysonr510@gmail.com";
  const pixCode = `00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${price.toFixed(2)}5802BR5913Allyson Ramos6009Sao Paulo62070503***6304`;

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleNotifyPayment = () => {
    const text = encodeURIComponent(
      `Olá Allyson! Acabei de assinar o plano *${selectedPlan.name}* no Nexus (${billingCycle === "YEARLY" ? "Anual" : "Mensal"}).\n\nMeu email cadastrado: *${user?.email || "meu-email"}*\nValor: R$ ${price.toFixed(2)}/mês.\n\nSegue o comprovante em anexo para liberação imediata!`
    );
    window.open(`https://wa.me/5581999999999?text=${text}`, "_blank");
    setStep("CONFIRMED");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-dash/15 text-dash">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground sm:text-lg">Checkout Seguro Nexus</h2>
              <p className="text-xs text-muted-foreground">Plano selecionado: <strong className="text-foreground">{selectedPlan.name}</strong></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-surface-raised hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {step === "CHECKOUT" ? (
          <div className="mt-4 space-y-4">
            {/* Resumo do Pedido */}
            <div className="rounded-xl border border-border/70 bg-surface-raised/40 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{selectedPlan.name}</p>
                <p className="text-xs text-muted-foreground">
                  Faturamento {billingCycle === "YEARLY" ? "Anual (com desconto)" : "Mensal"}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground">Total: </span>
                <span className="text-xl font-extrabold text-foreground">
                  R$ {price.toFixed(2).replace(".", ",")}
                </span>
                <span className="text-xs text-muted-foreground">/mês</span>
              </div>
            </div>

            {/* Abas de Método de Pagamento */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("PIX")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  paymentMethod === "PIX"
                    ? "border-dash bg-dash/10 text-dash shadow-sm"
                    : "border-border/70 bg-surface-raised/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <QrCode className="size-4" /> PIX Instantâneo (Recomendado)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("CREDIT_CARD")}
                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-semibold transition-all ${
                  paymentMethod === "CREDIT_CARD"
                    ? "border-dash bg-dash/10 text-dash shadow-sm"
                    : "border-border/70 bg-surface-raised/30 text-muted-foreground hover:text-foreground"
                }`}
              >
                <CreditCard className="size-4" /> Cartão / Stripe
              </button>
            </div>

            {paymentMethod === "PIX" ? (
              <div className="rounded-xl border border-border/70 bg-surface-raised/30 p-4 text-center space-y-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Chave PIX direta (E-mail do Fundador):
                </p>
                <div className="flex items-center justify-center gap-2 rounded-lg bg-surface p-2.5 border border-border font-mono text-xs text-foreground font-semibold">
                  <span>{pixKey}</span>
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="flex items-center gap-1 rounded px-2 py-1 bg-dash/15 text-dash hover:bg-dash/25 transition-colors text-[11px]"
                  >
                    {copied ? <CheckCheck className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                    {copied ? "Copiado!" : "Copiar Chave"}
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Faça a transferência no valor exato de <strong>R$ {price.toFixed(2).replace(".", ",")}</strong> e clique abaixo para confirmar via WhatsApp com o seu comprovante para liberação imediata.
                </p>
                <Button
                  onClick={handleNotifyPayment}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 py-2.5"
                >
                  <Zap className="size-4" /> Enviar Comprovante no WhatsApp
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-border/70 bg-surface-raised/30 p-4 text-center space-y-3">
                <CreditCard className="mx-auto size-8 text-dash" />
                <p className="text-xs font-medium text-foreground">
                  Pagamento com Cartão de Crédito ou Débito
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Processado com segurança pelo Stripe. Liberação automática da sua conta após a confirmação da operadora.
                </p>
                <Button
                  onClick={() => {
                    window.open(`https://buy.stripe.com/nexus-${selectedPlan.id.toLowerCase()}`, "_blank");
                    setStep("CONFIRMED");
                  }}
                  className="w-full text-xs font-semibold gap-1.5 py-2.5"
                >
                  Pagar R$ {price.toFixed(2).replace(".", ",")} com Stripe <ExternalLink className="size-3.5" />
                </Button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>Garantia incondicional de 7 dias ou seu dinheiro de volta.</span>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-center space-y-4 py-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Obrigado pela sua assinatura!</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Assim que confirmarmos seu pagamento, todos os recursos contratados serão desbloqueados automaticamente na sua conta.
            </p>
            <Button onClick={onClose} className="w-full text-xs">
              Voltar ao Nexus
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
