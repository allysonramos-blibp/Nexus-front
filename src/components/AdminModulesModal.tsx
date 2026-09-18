import { useState, useEffect } from "react";
import {
  X,
  Brain,
  Dumbbell,
  Wallet,
  Bot,
  Check,
  ShieldCheck,
  User,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface AdminUserModalData {
  id: number;
  email: string;
  role: string;
  status: "ATIVO" | "SUSPENSO" | "PENDENTE";
  plan: "STARTER" | "PRO" | "ENTERPRISE";
  modules: {
    estudos: boolean;
    treinos: boolean;
    financas: boolean;
    iaExtracao: boolean;
  };
  pdfExtractCount: number;
  pdfExtractLimit: number;
}

interface AdminModulesModalProps {
  user: AdminUserModalData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: number, payload: {
    estudos: boolean;
    treinos: boolean;
    financas: boolean;
    iaExtracao: boolean;
    pdfExtractLimit: number;
    plan: string;
  }) => Promise<void>;
}

export function AdminModulesModal({
  user,
  isOpen,
  onClose,
  onSave
}: AdminModulesModalProps) {
  if (!isOpen || !user) return null;

  const [estudos, setEstudos] = useState(user.modules.estudos);
  const [treinos, setTreinos] = useState(user.modules.treinos);
  const [financas, setFinancas] = useState(user.modules.financas);
  const [iaExtracao, setIaExtracao] = useState(user.modules.iaExtracao);
  const [limit, setLimit] = useState(user.pdfExtractLimit || 50);
  const [plan, setPlan] = useState(user.plan || "PRO");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEstudos(user.modules.estudos);
      setTreinos(user.modules.treinos);
      setFinancas(user.modules.financas);
      setIaExtracao(user.modules.iaExtracao);
      setLimit(user.pdfExtractLimit || 50);
      setPlan(user.plan || "PRO");
    }
  }, [user]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSave(user!.id, {
        estudos,
        treinos,
        financas,
        iaExtracao,
        pdfExtractLimit: Number(limit),
        plan
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-surface p-6 shadow-2xl">

        <div className="flex items-start justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-dash/15 text-dash">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-foreground">Permissões de Módulos & IA</h2>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-[280px]">
                {user.email} (ID #{user.id})
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

        <div className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Plano de Assinatura
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as any)}
              className="w-full rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="STARTER">Starter (Básico)</option>
              <option value="PRO">Pro (Avançado)</option>
              <option value="ENTERPRISE">Enterprise (Ilimitado)</option>
            </select>
          </div>

          <div className="space-y-2.5 pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Liberar ou Bloquear Módulos
            </p>

            <div className="flex items-center justify-between rounded-xl border border-border bg-surface-raised/40 p-3">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-study/15 text-study">
                  <Brain className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Módulo de Estudos</p>
                  <p className="text-[11px] text-muted-foreground">Planos, matérias, questões e simulados</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={estudos}
                onChange={(e) => setEstudos(e.target.checked)}
                className="size-5 cursor-pointer accent-study rounded"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-surface-raised/40 p-3">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-gym/15 text-gym">
                  <Dumbbell className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Módulo de Treinos</p>
                  <p className="text-[11px] text-muted-foreground">Fichas de exercícios e histórico de cargas</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={treinos}
                onChange={(e) => setTreinos(e.target.checked)}
                className="size-5 cursor-pointer accent-gym rounded"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border bg-surface-raised/40 p-3">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-fin/15 text-fin">
                  <Wallet className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Módulo de Finanças</p>
                  <p className="text-[11px] text-muted-foreground">Transações, metas e gráficos de despesas</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={financas}
                onChange={(e) => setFinancas(e.target.checked)}
                className="size-5 cursor-pointer accent-fin rounded"
              />
            </div>

            <div className="rounded-xl border border-border bg-surface-raised/40 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-dash/15 text-dash">
                    <Bot className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Parser de PDF & Assistente IA</p>
                    <p className="text-[11px] text-muted-foreground">Extração inteligente e auto-classificação</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={iaExtracao}
                  onChange={(e) => setIaExtracao(e.target.checked)}
                  className="size-5 cursor-pointer accent-dash rounded"
                />
              </div>

              {iaExtracao && (
                <div className="mt-2 border-t border-border/60 pt-3 flex items-center justify-between gap-4">
                  <div className="text-xs">
                    <span className="text-muted-foreground">Limite de extrações:</span>
                    <span className="ml-1 font-semibold text-foreground">
                      {user.pdfExtractCount} utilizadas
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      max={99999}
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="w-24 h-8 text-xs text-right"
                    />
                    <span className="text-xs text-muted-foreground">créditos</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}
