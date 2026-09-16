import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, Sparkles, ArrowRight, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/Button";

export type ModuleKey = "estudos" | "treinos" | "financas" | "iaExtracao";

interface ModuleConfig {
  title: string;
  description: string;
  benefits: string[];
}

const MODULE_DESCRIPTIONS: Record<ModuleKey, ModuleConfig> = {
  estudos: {
    title: "Módulo de Estudos & Concursos",
    description: "Crie planos de estudo personalizados, simulados cronometrados, caderno de erros e análise de desempenho por matéria.",
    benefits: [
      "Cronograma inteligente adaptativo",
      "Banco de questões com gabarito comentado",
      "Simulados completos com temporizador",
      "Caderno de erros para revisões pontuais"
    ],
  },
  treinos: {
    title: "Módulo de Treinos & Físico",
    description: "Gerencie suas rotinas de treino, histórico de cargas, ficha de exercícios e evolução corporal.",
    benefits: [
      "Fichas customizadas de musculação",
      "Histórico de evolução e progressão de carga",
      "Cronômetro de descanso integrado",
      "Métricas de consistência semanal"
    ],
  },
  financas: {
    title: "Módulo de Finanças Pessoais",
    description: "Controle receitas, despesas, parcelamentos com cartão, alertas de contas a vencer e análise financeira com IA.",
    benefits: [
      "Lançamentos parcelados automáticos",
      "Alertas de vencimento antecipados",
      "Gráfico de projeção e saldo previsto",
      "Diagnóstico financeiro com IA Nexus"
    ],
  },
  iaExtracao: {
    title: "Módulo de Inteligência Artificial & Extração",
    description: "Importação e processamento de provas em PDF com IA, geração de simulados e tutor 24h.",
    benefits: [
      "Extração inteligente de questões em PDF",
      "Auto-categorização de matérias e bancas",
      "Tutor de IA disponível em popup em todo o app",
      "Créditos ampliados de processamento"
    ],
  },
};

export function ModuleUpgradeGuard({
  moduleKey,
  children,
}: {
  moduleKey: ModuleKey;
  children: ReactNode;
}) {
  const { user } = useAuth();

  if (!user) return null;

  const isMasterAdmin =
    user.email === "allysonr510@gmail.com" || user.role === "ROLE_ADMIN";

  // Mapeamento das permissões do usuário
  const hasAccess =
    isMasterAdmin ||
    (moduleKey === "estudos" && user.moduloEstudos !== false) ||
    (moduleKey === "treinos" && user.moduloTreinos !== false) ||
    (moduleKey === "financas" && user.moduloFinancas !== false) ||
    (moduleKey === "iaExtracao" && user.moduloIaExtracao !== false);

  if (hasAccess) {
    return <>{children}</>;
  }

  const config = MODULE_DESCRIPTIONS[moduleKey];

  return (
    <AppShell title="Módulo Bloqueado" subtitle="Upgrade de Plano">
      <div className="flex min-h-[65vh] flex-col items-center justify-center p-4 text-center">
        <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-surface p-8 shadow-xl">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500 mb-4 border border-amber-500/20">
            <Lock className="size-7" />
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500 border border-amber-500/20 mb-2">
            Recurso Exclusivo
          </span>

          <h2 className="text-xl font-bold text-foreground sm:text-2xl">
            {config.title}
          </h2>

          <p className="mt-2 text-xs text-muted-foreground sm:text-sm leading-relaxed">
            {config.description}
          </p>

          <div className="my-6 rounded-xl border border-border/60 bg-surface-raised/50 p-4 text-left">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" /> O que está incluso neste módulo:
            </p>
            <ul className="space-y-2 text-xs text-muted-foreground">
              {config.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full text-xs">
                Voltar ao Início
              </Button>
            </Link>

            <Link to="/perfil" className="w-full sm:w-auto">
              <Button className="w-full text-xs font-semibold bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90">
                Fazer Upgrade de Assinatura <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
