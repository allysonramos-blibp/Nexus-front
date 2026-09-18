import { useState } from "react";
import {
  Check, Sparkles, Zap, Star, Lock, CreditCard, QrCode
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SAAS_PLANS, CheckoutModal, type PlanDetails } from "@/components/CheckoutModal";
import { useAuth } from "@/lib/auth";

export default function PlanosPage() {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "YEARLY">("YEARLY");
  const [selectedPlan, setSelectedPlan] = useState<PlanDetails | null>(null);

  const handleOpenCheckout = (plan: PlanDetails) => {
    setSelectedPlan(plan);
  };

  return (
    <AppShell title="Planos & Assinatura" subtitle="Escolha o plano ideal para acelerar sua aprovação e consistência">

      <div className="relative overflow-hidden rounded-2xl border border-dash/30 bg-gradient-to-r from-dash/15 via-study/10 to-surface-raised p-5 sm:p-6 mb-6">
        <div className="space-y-1 max-w-xl">
          <span className="inline-flex items-center gap-1 rounded-full bg-dash/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-dash border border-dash/30">
            <Sparkles className="size-3" /> Planos & Assinaturas Nexus
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
            O ecossistema definitivo para Concursos, Treinos e Finanças
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Tenha acesso completo a simulados inteligentes, repetição espaçada, controle de treinos, finanças e tutor com IA.
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center my-6 space-y-2">
        <div className="inline-flex items-center rounded-xl border border-border bg-surface-raised p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setBillingCycle("MONTHLY")}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              billingCycle === "MONTHLY"
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Faturamento Mensal
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("YEARLY")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all ${
              billingCycle === "YEARLY"
                ? "bg-dash text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Faturamento Anual
            <span className="rounded-full bg-emerald-400/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
              Economize 20%
            </span>
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Lock className="size-3 text-emerald-400" /> Pagamento com Chave PIX (34992005737) ou Cartão de Crédito com Comprovante em PDF
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {SAAS_PLANS.map((plan) => {
          const price = billingCycle === "YEARLY" ? plan.priceYearly : plan.priceMonthly;
          const isCurrentPlan = user?.plan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-2xl border bg-surface p-6 shadow-md transition-all hover:shadow-xl ${
                plan.popular
                  ? "border-dash/80 ring-2 ring-dash/20 scale-[1.02]"
                  : "border-border/80"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-dash px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                    <Star className="size-3 fill-current" /> Recomendado
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  {isCurrentPlan && (
                    <Badge variant="success">Plano Atual</Badge>
                  )}
                </div>

                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {plan.description}
                </p>

                <div className="mt-5 pb-5 border-b border-border/60">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-semibold text-muted-foreground">R$</span>
                    <span className="text-3xl font-extrabold text-foreground tracking-tight">
                      {price.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-xs text-muted-foreground">/mês</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {billingCycle === "YEARLY" ? `Cobrado anualmente (R$ ${(plan.priceYearly * 12).toFixed(2).replace(".", ",")}/ano)` : "Sem fidelidade, cancele quando quiser"}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <QrCode className="size-3" /> PIX Instantâneo
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <CreditCard className="size-3 text-dash" /> Cartão até 12x
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    O que está incluso:
                  </p>
                  <ul className="space-y-2.5 text-xs text-muted-foreground">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="size-4 shrink-0 text-dash mt-0.5" />
                        <span className="text-foreground/90">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4">
                <Button
                  onClick={() => handleOpenCheckout(plan)}
                  className={`w-full text-xs font-semibold py-2.5 gap-1.5 ${
                    plan.popular
                      ? "bg-dash hover:bg-dash/90 text-white shadow-md shadow-dash/20"
                      : ""
                  }`}
                  variant={plan.popular ? "primary" : "outline"}
                >
                  <Zap className="size-4" />
                  {isCurrentPlan ? "Renovar Assinatura" : `Assinar ${plan.name}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlan && (
        <CheckoutModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          selectedPlan={selectedPlan}
          billingCycle={billingCycle}
          onSelectPlan={(newPlan) => setSelectedPlan(newPlan)}
          onSelectCycle={(newCycle) => setBillingCycle(newCycle)}
        />
      )}
    </AppShell>
  );
}
