import { useState } from "react";
import { 
  Users, 
  ShieldCheck, 
  CheckCircle2, 
  Ban, 
  Search, 
  Layers, 
  TrendingUp, 
  AlertCircle,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/contexts/ToastContext";

interface SaasTenant {
  id: number;
  email: string;
  plan: "STARTER" | "PRO" | "ENTERPRISE";
  status: "ATIVO" | "SUSPENSO" | "PENDENTE";
  modules: {
    estudos: boolean;
    treinos: boolean;
    financas: boolean;
    iaExtracao: boolean;
  };
  totalQuestoes: number;
  simuladosCriados: number;
  ultimoAcesso: string;
}

const INITIAL_TENANTS: SaasTenant[] = [
  {
    id: 1,
    email: "allysonr510@gmail.com",
    plan: "ENTERPRISE",
    status: "ATIVO",
    modules: { estudos: true, treinos: true, financas: true, iaExtracao: true },
    totalQuestoes: 2350,
    simuladosCriados: 48,
    ultimoAcesso: "Hoje às 18:20",
  },
  {
    id: 2,
    email: "concurseiro.elite@gmail.com",
    plan: "PRO",
    status: "ATIVO",
    modules: { estudos: true, treinos: true, financas: false, iaExtracao: true },
    totalQuestoes: 840,
    simuladosCriados: 12,
    ultimoAcesso: "Ontem às 21:05",
  },
  {
    id: 3,
    email: "mariana.estudos@outlook.com",
    plan: "STARTER",
    status: "SUSPENSO",
    modules: { estudos: true, treinos: false, financas: false, iaExtracao: false },
    totalQuestoes: 120,
    simuladosCriados: 3,
    ultimoAcesso: "Há 4 dias",
  },
  {
    id: 4,
    email: "carlos.oab2026@gmail.com",
    plan: "PRO",
    status: "ATIVO",
    modules: { estudos: true, treinos: true, financas: true, iaExtracao: true },
    totalQuestoes: 1450,
    simuladosCriados: 26,
    ultimoAcesso: "Hoje às 14:15",
  },
  {
    id: 5,
    email: "pedro.tribunais@gmail.com",
    plan: "STARTER",
    status: "PENDENTE",
    modules: { estudos: true, treinos: false, financas: false, iaExtracao: false },
    totalQuestoes: 45,
    simuladosCriados: 1,
    ultimoAcesso: "Há 2 dias",
  }
];

export default function AdminPage() {
  const [tenants, setTenants] = useState<SaasTenant[]>(() => {
    const saved = localStorage.getItem("nexus_admin_tenants");
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const { toast } = useToast();

  function saveTenants(newList: SaasTenant[]) {
    setTenants(newList);
    localStorage.setItem("nexus_admin_tenants", JSON.stringify(newList));
  }

  function toggleStatus(id: number) {
    const updated = tenants.map((t) => {
      if (t.id === id) {
        const nextStatus = t.status === "ATIVO" ? "SUSPENSO" : "ATIVO";
        toast(`Usuário ${t.email} agora está ${nextStatus}.`, nextStatus === "ATIVO" ? "success" : "error");
        return { ...t, status: nextStatus as SaasTenant["status"] };
      }
      return t;
    });
    saveTenants(updated);
  }

  function toggleModule(id: number, moduleKey: keyof SaasTenant["modules"]) {
    const updated = tenants.map((t) => {
      if (t.id === id) {
        const current = t.modules[moduleKey];
        toast(`Módulo ${moduleKey} ${!current ? "liberado" : "bloqueado"} para ${t.email}.`, "success");
        return {
          ...t,
          modules: { ...t.modules, [moduleKey]: !current },
        };
      }
      return t;
    });
    saveTenants(updated);
  }

  const filteredTenants = tenants.filter((t) => {
    const matchSearch = t.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlan = selectedPlanFilter === "ALL" || t.plan === selectedPlanFilter;
    const matchStatus = selectedStatusFilter === "ALL" || t.status === selectedStatusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const totalAtivos = tenants.filter((t) => t.status === "ATIVO").length;
  const totalQuestoesImportadas = tenants.reduce((acc, t) => acc + t.totalQuestoes, 0);

  return (
    <AppShell title="Painel SaaS" subtitle="Administração de Assinantes & Módulos">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 border-border/80 bg-surface">
          <span className="flex size-11 items-center justify-center rounded-xl bg-dash/15 text-dash">
            <Users className="size-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Total de Assinantes</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{tenants.length}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-border/80 bg-surface">
          <span className="flex size-11 items-center justify-center rounded-xl bg-fin/15 text-fin">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Assinaturas Ativas</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{totalAtivos}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-border/80 bg-surface">
          <span className="flex size-11 items-center justify-center rounded-xl bg-study/15 text-study">
            <Layers className="size-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Questões no Banco</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{totalQuestoesImportadas}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 border-border/80 bg-surface">
          <span className="flex size-11 items-center justify-center rounded-xl bg-gym/15 text-gym">
            <TrendingUp className="size-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Disponibilidade API</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">99.98%</p>
          </div>
        </Card>
      </div>

      {/* Tabela e Filtros de Gerenciamento */}
      <Card className="p-6 border-border/80 bg-surface">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Gerenciamento Granular de Assinantes</h2>
            <p className="text-xs text-muted-foreground">
              Suspenda inadimplentes e libere/bloqueie módulos em tempo real sem reiniciar o servidor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <select
              value={selectedPlanFilter}
              onChange={(e) => setSelectedPlanFilter(e.target.value)}
              className="rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-xs text-foreground"
            >
              <option value="ALL">Todos os Planos</option>
              <option value="STARTER">Starter</option>
              <option value="PRO">Pro</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-surface-raised px-2.5 py-1.5 text-xs text-foreground"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ATIVO">Ativo</option>
              <option value="SUSPENSO">Suspenso</option>
              <option value="PENDENTE">Pendente</option>
            </select>
          </div>
        </div>

        {/* Listagem de Usuários */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface-raised/50 text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Assinante</th>
                <th className="py-3 px-4">Plano</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Módulos Liberados</th>
                <th className="py-3 px-4">Questões</th>
                <th className="py-3 px-4 text-right">Ações Rápidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTenants.map((t) => (
                <tr key={t.id} className="hover:bg-surface-raised/30 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-foreground">
                    <p className="font-semibold">{t.email}</p>
                    <span className="text-[11px] text-muted-foreground">Visto: {t.ultimoAcesso}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.plan === "ENTERPRISE" ? "bg-study/20 text-study border border-study/30" :
                      t.plan === "PRO" ? "bg-dash/20 text-dash border border-dash/30" :
                      "bg-surface-raised text-muted-foreground border border-border"
                    }`}>
                      {t.plan}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      t.status === "ATIVO" ? "bg-emerald-500/15 text-emerald-400" :
                      t.status === "SUSPENSO" ? "bg-rose-500/15 text-rose-400" :
                      "bg-amber-500/15 text-amber-400"
                    }`}>
                      <span className={`size-1.5 rounded-full ${
                        t.status === "ATIVO" ? "bg-emerald-400" :
                        t.status === "SUSPENSO" ? "bg-rose-400" :
                        "bg-amber-400"
                      }`} />
                      {t.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <button
                        title="Módulo Estudos"
                        onClick={() => toggleModule(t.id, "estudos")}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          t.modules.estudos ? "bg-study/20 text-study font-semibold" : "bg-surface-raised text-muted-foreground/50 line-through"
                        }`}
                      >
                        Estudos
                      </button>
                      <button
                        title="Módulo Treinos"
                        onClick={() => toggleModule(t.id, "treinos")}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          t.modules.treinos ? "bg-gym/20 text-gym font-semibold" : "bg-surface-raised text-muted-foreground/50 line-through"
                        }`}
                      >
                        Treinos
                      </button>
                      <button
                        title="Módulo Finanças"
                        onClick={() => toggleModule(t.id, "financas")}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          t.modules.financas ? "bg-fin/20 text-fin font-semibold" : "bg-surface-raised text-muted-foreground/50 line-through"
                        }`}
                      >
                        Finanças
                      </button>
                      <button
                        title="Módulo Extração IA"
                        onClick={() => toggleModule(t.id, "iaExtracao")}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          t.modules.iaExtracao ? "bg-dash/20 text-dash font-semibold" : "bg-surface-raised text-muted-foreground/50 line-through"
                        }`}
                      >
                        Parser PDF
                      </button>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-muted-foreground">
                    <span className="font-semibold text-foreground">{t.totalQuestoes}</span> qts
                    <span className="block text-[10px] text-muted-foreground">{t.simuladosCriados} simulados</span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant={t.status === "ATIVO" ? "secondary" : "primary"}
                      onClick={() => toggleStatus(t.id)}
                      className="h-7 text-xs px-2.5"
                    >
                      {t.status === "ATIVO" ? (
                        <>
                          <Ban className="size-3 mr-1 text-rose-400" /> Suspender
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="size-3 mr-1 text-emerald-400" /> Ativar Acesso
                        </>
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AppShell>
  );
}
