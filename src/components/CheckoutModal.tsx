import { useState } from "react";
import {
  X,
  Check,
  Sparkles,
  ShieldCheck,
  QrCode,
  CreditCard,
  Copy,
  CheckCheck,
  FileDown,
  Zap,
  Lock,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { generateReceiptPdf, type PlanDetails, type ReceiptData } from "@/lib/generateReceiptPdf";
import { getKiwifyUrlForPlan, buildKiwifyCheckoutUrl } from "@/lib/kiwifyConfig";

export { type PlanDetails } from "@/lib/generateReceiptPdf";

export const SAAS_PLANS: PlanDetails[] = [
  {
    id: "STARTER",
    name: "Nexus Starter",
    priceMonthly: 29.9,
    priceYearly: 24.9,
    description:
      "Ideal para concurseiros e estudantes que precisam organizar a rotina com disciplina.",
    features: [
      "Módulo completo de Estudos & Concursos",
      "Banco de Questões e Gabarito Interativo",
      "Repetição Espaçada Inteligente (FSRS)",
      "Caderno de Erros Automático",
      "Exportação de Relatórios e Simulados",
      "Acesso ao PWA com modo Offline",
    ],
  },
  {
    id: "PRO",
    name: "Nexus Pro All-in-One",
    priceMonthly: 49.9,
    priceYearly: 39.9,
    popular: true,
    description:
      "A experiência total: Concursos, Treinos de Academia, Gestão Financeira e Tutor com IA.",
    features: [
      "TUDO do Plano Starter",
      "Módulo de Treinos com Cargas e Histórico",
      "Módulo Financeiro com Parcelas e Extrato",
      "Quadro Kanban de Tarefas & Timer Pomodoro",
      "Tutor de IA Integrado em Todas as Telas",
      "Desdobramento Automático de Metas com IA",
      "Alertas Nativos e Notificações Push",
      "Suporte Prioritário via WhatsApp",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Nexus Mentor & Equipe",
    priceMonthly: 99.9,
    priceYearly: 79.9,
    description:
      "Perfeito para mentores de concurso, personal trainers ou profissionais de alta performance.",
    features: [
      "TUDO do Plano Pro All-in-One",
      "Múltiplos Perfis de Alunos e Mentorados",
      "Painel de Auditoria e Métricas de Progresso",
      "Diagnósticos Financeiros e de Estudos com IA",
      "Backup Diário em Nuvem Seguro",
      "Acesso Antecipado a Novas Funcionalidades",
      "Onboarding Exclusivo 1-a-1",
    ],
  },
];

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: PlanDetails;
  billingCycle: "MONTHLY" | "YEARLY";
  onSelectPlan?: (plan: PlanDetails) => void;
  onSelectCycle?: (cycle: "MONTHLY" | "YEARLY") => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  selectedPlan: initialPlan,
  billingCycle: initialCycle,
  onSelectPlan,
  onSelectCycle,
}: CheckoutModalProps) {
  const { user } = useAuth();

  const [currentPlan, setCurrentPlan] = useState<PlanDetails>(initialPlan);
  const [currentCycle, setCurrentCycle] = useState<"MONTHLY" | "YEARLY">(initialCycle);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"CHECKOUT" | "CONFIRMED">("CHECKOUT");

  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState(user?.email?.split("@")[0] || "");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState("1");
  const [processingCard, setProcessingCard] = useState(false);

  const PIX_KEY = "34992005737";
  const PIX_RECEIVER = "Allyson Ramos";
  const PIX_CITY = "Uberlândia";
  const WHATSAPP_NUMBER = "5534992005737";

  if (!isOpen) return null;

  const price = currentCycle === "YEARLY" ? currentPlan.priceYearly : currentPlan.priceMonthly;
  const totalAnnualAmount = currentPlan.priceYearly * 12;
  const finalChargeAmount = currentCycle === "YEARLY" ? totalAnnualAmount : price;

  const handlePlanChange = (planId: string) => {
    const found = SAAS_PLANS.find((p) => p.id === planId);
    if (found) {
      setCurrentPlan(found);
      onSelectPlan?.(found);
    }
  };

  const handleCycleChange = (cycle: "MONTHLY" | "YEARLY") => {
    setCurrentCycle(cycle);
    onSelectCycle?.(cycle);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const buildReceiptData = (): ReceiptData => {
    const randomOrderId = Math.floor(100000 + Math.random() * 900000).toString();
    const cleanCardLast4 = cardNumber.replace(/\D/g, "").slice(-4) || "4242";
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1
    ).padStart(2, "0")}/${now.getFullYear()} às ${String(
      now.getHours()
    ).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    return {
      orderId: randomOrderId,
      userName: cardHolder || user?.email?.split("@")[0] || "Assinante Nexus",
      userEmail: user?.email || "usuario@nexus.com",
      plan: currentPlan,
      billingCycle: currentCycle,
      paymentMethod,
      amount: finalChargeAmount,
      pixKey: PIX_KEY,
      pixReceiverName: PIX_RECEIVER,
      pixCity: PIX_CITY,
      cardLast4: cleanCardLast4,
      cardHolder: cardHolder || user?.email?.split("@")[0] || "Assinante Nexus",
      installments: Number(installments) || 1,
      paidAt: formattedDate,
    };
  };

  const handleDownloadReceipt = () => {
    const receiptData = buildReceiptData();
    generateReceiptPdf(receiptData);
  };

  const handleNotifyPixWhatsApp = () => {
    const receipt = buildReceiptData();
    generateReceiptPdf(receipt);

    const msg = encodeURIComponent(
      `Olá Allyson! Acabei de realizar o pagamento PIX da assinatura do Nexus.\n\n` +
        `• Plano: *${currentPlan.name}* (${currentCycle === "YEARLY" ? "Anual" : "Mensal"})\n` +
        `• Valor: *R$ ${finalChargeAmount.toFixed(2).replace(".", ",")}*\n` +
        `• Chave enviada: *${PIX_KEY}*\n` +
        `• Meu e-mail de acesso: *${user?.email || "meu-email"}*\n` +
        `• Pedido: *#${receipt.orderId}*\n\n` +
        `Já gerei meu comprovante em PDF e estou enviando aqui para liberação da conta!`
    );

    window.open(
      `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${msg}`,
      "_blank"
    );
    setStep("CONFIRMED");
  };

  const handleProcessCardPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingCard(true);

    setTimeout(() => {
      setProcessingCard(false);
      setStep("CONFIRMED");
      const receipt = buildReceiptData();
      generateReceiptPdf(receipt);
    }, 1200);
  };

  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 16);
    const parts = raw.match(/.{1,4}/g) || [];
    setCardNumber(parts.join(" "));
  };

  const handleExpiryChange = (val: string) => {
    const raw = val.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      setCardExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setCardExpiry(raw);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-border/80 bg-surface p-5 sm:p-7 shadow-2xl my-auto">

        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-dash/15 text-dash">
              <Sparkles className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                Checkout de Assinatura Nexus
              </h2>
              <p className="text-xs text-muted-foreground">
                Pagamento seguro via PIX ou Cartão • Comprovante em PDF
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

        {step === "CHECKOUT" ? (
          <div className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                1. Escolha ou Altere o Plano:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SAAS_PLANS.map((plan) => {
                  const isSelected = currentPlan.id === plan.id;
                  const p = currentCycle === "YEARLY" ? plan.priceYearly : plan.priceMonthly;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => handlePlanChange(plan.id)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all ${
                        isSelected
                          ? "border-dash bg-dash/15 text-dash ring-2 ring-dash/30 font-bold"
                          : "border-border/70 bg-surface-raised/40 text-muted-foreground hover:border-border hover:text-foreground"
                      }`}
                    >
                      <span className="text-[11px] font-semibold truncate w-full">
                        {plan.name.replace("Nexus ", "")}
                      </span>
                      <span className="text-xs font-black text-foreground mt-0.5">
                        R$ {p.toFixed(2).replace(".", ",")}
                      </span>
                      <span className="text-[9px] text-muted-foreground">/mês</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-surface-raised/30 p-2.5">
              <span className="text-xs font-medium text-foreground">
                Ciclo de Cobrança:
              </span>
              <div className="inline-flex items-center rounded-lg border border-border bg-surface p-0.5">
                <button
                  type="button"
                  onClick={() => handleCycleChange("MONTHLY")}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                    currentCycle === "MONTHLY"
                      ? "bg-surface-raised text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Mensal
                </button>
                <button
                  type="button"
                  onClick={() => handleCycleChange("YEARLY")}
                  className={`flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                    currentCycle === "YEARLY"
                      ? "bg-dash text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Anual (-20%)
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-dash/30 bg-dash/5 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">
                  {currentPlan.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {currentCycle === "YEARLY"
                    ? `Plano Anual: R$ ${currentPlan.priceYearly.toFixed(2).replace(".", ",")}/mês (Total de R$ ${totalAnnualAmount.toFixed(2).replace(".", ",")})`
                    : `Plano Mensal: R$ ${price.toFixed(2).replace(".", ",")}/mês`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                  Valor a Pagar:
                </span>
                <span className="text-xl font-black text-foreground">
                  R$ {finalChargeAmount.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                2. Forma de Pagamento:
              </label>
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
                  <QrCode className="size-4" /> PIX Instantâneo
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
                  <CreditCard className="size-4" /> Cartão de Crédito
                </button>
              </div>
            </div>

            {paymentMethod === "PIX" ? (
              <div className="rounded-xl border border-border/70 bg-surface-raised/30 p-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Chave PIX (Celular):</span>
                  <span className="font-semibold text-foreground">
                    Titular: {PIX_RECEIVER}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 rounded-lg bg-surface p-2.5 border border-border font-mono text-sm text-foreground font-bold">
                  <span className="tracking-wider">{PIX_KEY}</span>
                  <button
                    type="button"
                    onClick={handleCopyPix}
                    className="flex items-center gap-1 rounded-md px-2.5 py-1 bg-dash/15 text-dash hover:bg-dash/25 transition-colors text-xs font-sans font-semibold"
                  >
                    {copied ? (
                      <CheckCheck className="size-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                    {copied ? "Copiado!" : "Copiar Chave"}
                  </button>
                </div>

                <div className="rounded-lg bg-surface/60 p-3 border border-border/60 text-[11px] text-muted-foreground space-y-1">
                  <p>
                    • Faça a transferência no valor exato de{" "}
                    <strong className="text-foreground">
                      R$ {finalChargeAmount.toFixed(2).replace(".", ",")}
                    </strong>
                    .
                  </p>
                  <p>
                    • Chave Pix cadastrada: <strong>34992005737</strong> (Celular).
                  </p>
                  <p>
                    • Clique abaixo para baixar seu comprovante ou notificar no WhatsApp.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadReceipt}
                    className="w-full text-xs font-semibold gap-1.5 py-2.5 border-border"
                  >
                    <FileDown className="size-4 text-dash" /> Baixar Comprovante PDF
                  </Button>
                  <Button
                    type="button"
                    onClick={handleNotifyPixWhatsApp}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 py-2.5"
                  >
                    <Zap className="size-4" /> Confirmar via WhatsApp
                  </Button>
                </div>
              </div>
            ) : (
              /* PAINEL CARTÃO DE CRÉDITO VIA KIWIFY */
              <div className="rounded-xl border border-border/70 bg-surface-raised/30 p-4 space-y-4">
                <div className="flex items-center justify-between text-xs pb-1 border-b border-border/60">
                  <div className="flex items-center gap-1.5 text-foreground font-semibold">
                    <Lock className="size-3.5 text-emerald-400" /> Checkout Seguro via Kiwify
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    Visa • Master • Elo • Hiper
                  </span>
                </div>

                <div className="rounded-lg bg-surface p-3.5 border border-border space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Plano Selecionado:</span>
                    <strong className="text-foreground">{currentPlan.name}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Modalidade:</span>
                    <span className="font-medium text-foreground">
                      {currentCycle === "YEARLY" ? "Anual (Até 12x com desconto)" : "Mensal Recorrente"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Valor:</span>
                    <span className="text-sm font-black text-emerald-400">
                      R$ {finalChargeAmount.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                    <span>E-mail do Aluno vinculado:</span>
                    <span className="font-mono font-semibold text-foreground">{user?.email || "aluno@nexus.com"}</span>
                  </div>
                </div>

                {(() => {
                  const rawUrl = getKiwifyUrlForPlan(currentPlan.id, currentCycle);
                  const userName = user?.email?.split("@")[0] || "Aluno Nexus";
                  const checkoutUrl = rawUrl ? buildKiwifyCheckoutUrl(rawUrl, user?.email, userName) : "";

                  if (checkoutUrl) {
                    return (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Clique abaixo para abrir a página oficial da Kiwify. Seus dados já serão vinculados para liberação automática assim que o pagamento for aprovado.
                        </p>
                        <Button
                          type="button"
                          onClick={() => window.open(checkoutUrl, "_blank")}
                          className="w-full bg-dash hover:bg-dash/90 text-white font-bold text-xs gap-2 py-3 shadow-md shadow-dash/20"
                        >
                          <CreditCard className="size-4" /> Finalizar Assinatura na Kiwify <ExternalLink className="size-3.5" />
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 space-y-2.5 text-xs text-foreground">
                      <p className="leading-relaxed text-muted-foreground">
                        O checkout com cartão via Kiwify está pronto. Se você é o administrador, configure o link da oferta no <strong>Painel Admin</strong>.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setPaymentMethod("PIX")}
                          className="w-full text-xs font-semibold"
                        >
                          <QrCode className="size-3.5" /> Pagar via PIX Instantâneo
                        </Button>
                        {user?.email === "allysonr510@gmail.com" && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              onClose();
                              window.location.href = "/admin";
                            }}
                            className="w-full bg-dash text-white text-xs font-semibold"
                          >
                            Configurar Links no Admin
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-1">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>Garantia incondicional de 7 dias ou cancelamento sem burocracia.</span>
            </div>
          </div>
        ) : (

          <div className="mt-4 text-center space-y-4 py-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="size-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Pagamento Registrado com Sucesso!
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed mt-1">
                Plano <strong>{currentPlan.name}</strong> ({currentCycle === "YEARLY" ? "Anual" : "Mensal"}).
                Seu comprovante oficial em PDF já foi gerado.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border/70 bg-surface-raised/40 max-w-sm mx-auto text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plano:</span>
                <span className="font-semibold text-foreground">{currentPlan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-bold text-emerald-400">
                  R$ {finalChargeAmount.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método:</span>
                <span className="text-foreground font-medium">
                  {paymentMethod === "PIX" ? "PIX Instantâneo" : "Cartão de Crédito"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chave Pix Favorecida:</span>
                <span className="font-mono text-foreground font-semibold">{PIX_KEY}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-sm mx-auto pt-2">
              <Button
                onClick={handleDownloadReceipt}
                className="w-full text-xs font-semibold gap-1.5 bg-dash hover:bg-dash/90 text-white"
              >
                <FileDown className="size-4" /> Baixar Comprovante PDF
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full text-xs"
              >
                Concluir & Acessar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
