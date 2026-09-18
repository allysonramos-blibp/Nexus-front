import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  Ban,
  Search,
  Layers,
  TrendingUp,
  FolderKanban,
  RefreshCw,
  SlidersHorizontal,
  Bot,
  Download
} from "lucide-react";
import { downloadArchitecturePdf } from "@/lib/generateArchitecturePresentationPdf";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Loading } from "@/components/ui/Loading";
import { ErrorState } from "@/components/ui/ErrorState";
import { useToast } from "@/contexts/ToastContext";
import { api } from "@/lib/api";
import { AdminModulesModal, type AdminUserModalData } from "@/components/AdminModulesModal";

interface AdminUser {
  id: number;
  email: string;
  role: string;
  active: boolean;
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
  totalQuestoes: number;
  simuladosCriados: number;
  totalPlanos: number;
  ultimoAcesso: string;
}

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");

  const [selectedUserForModal, setSelectedUserForModal] = useState<AdminUser | null>(null);

  const {
    data: users = [],
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => api.listAdminUsers(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: string }) =>
      api.updateAdminUserStatus(id, nextStatus),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["admin-users"], (old: AdminUser[] | undefined) => {
        if (!old) return [];
        return old.map((u) =>
          u.id === variables.id ? {
            ...u,
            status: variables.nextStatus as AdminUser["status"],
            active: variables.nextStatus === "ATIVO"
          } : u
        );
      });
      toast(`Status do usuário atualizado para ${variables.nextStatus}.`, variables.nextStatus === "ATIVO" ? "success" : "error");
    },
    onError: () => {
      toast("Erro ao sincronizar status com a API.", "error");
    }
  });

  // Mutação para atualizar módulos e limites no modal
  const saveModulesMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) =>
      api.updateAdminUserModules(id, payload),
    onSuccess: (_, variables) => {
      queryClient.setQueryData(["admin-users"], (old: AdminUser[] | undefined) => {
        if (!old) return [];
        return old.map((u) => {
          if (u.id === variables.id) {
            return {
              ...u,
              plan: variables.payload.plan || u.plan,
              modules: {
                estudos: variables.payload.estudos,
                treinos: variables.payload.treinos,
                financas: variables.payload.financas,
                iaExtracao: variables.payload.iaExtracao,
              },
              pdfExtractLimit: variables.payload.pdfExtractLimit,
            };
          }
          return u;
        });
      });
      toast("Permissões e limites salvos com sucesso!", "success");
    },
    onError: () => {
      toast("Erro ao salvar permissões do usuário.", "error");
    }
  });

  function handleToggleStatus(user: AdminUser) {
    if (user.email === "allysonr510@gmail.com") {
      toast("O administrador mestre não pode ser suspenso.", "error");
      return;
    }
    const nextStatus = user.status === "ATIVO" ? "SUSPENSO" : "ATIVO";
    statusMutation.mutate({ id: user.id, nextStatus });
  }

  const filteredUsers = users.filter((u: AdminUser) => {
    const matchSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlan = selectedPlanFilter === "ALL" || u.plan === selectedPlanFilter;
    const matchStatus = selectedStatusFilter === "ALL" || u.status === selectedStatusFilter;
    return matchSearch && matchPlan && matchStatus;
  });

  const totalAtivos = users.filter((u: AdminUser) => u.status === "ATIVO").length;
  const totalQuestoesImportadas = users.reduce((acc: number, u: AdminUser) => acc + (u.totalQuestoes || 0), 0);
  const totalPlanosCriados = users.reduce((acc: number, u: AdminUser) => acc + (u.totalPlanos || 0), 0);

  return (
    <AppShell
      title="Painel SaaS"
      subtitle="Gerenciamento de Assinantes & Módulos"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => downloadArchitecturePdf()}
            className="gap-1.5 text-xs"
          >
            <Download className="size-3.5 text-dash" />
            PDF da Arquitetura
          </Button>
          <Button
            variant="secondary"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Sincronizar
          </Button>
        </div>
      }
    >

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 border-border/80 bg-surface">
          <span className="flex size-11 items-center justify-center rounded-xl bg-dash/15 text-dash">
            <Users className="size-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Clientes Cadastrados</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{users.length}</p>
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
            <FolderKanban className="size-5" />
          </span>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Planos de Estudo</p>
            <p className="text-2xl font-bold tracking-tight text-foreground">{totalPlanosCriados}</p>
          </div>
        </Card>
      </div>

      <Card className="p-6 border-border/80 bg-surface">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Lista de Assinantes & Controle de Acesso</h2>
            <p className="text-xs text-muted-foreground">
              Ative ou suspenda contas em 1 clique e controle o que cada usuário pode acessar.
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

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loading label="Carregando usuários do sistema..." />
          </div>
        ) : error ? (
          <ErrorState error={error} compact />
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Nenhum usuário cadastrado ou encontrado com os filtros.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-raised/50 text-muted-foreground uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-4">Papel / Plano</th>
                  <th className="py-3 px-4">Status da Conta</th>
                  <th className="py-3 px-4">Módulos Habilitados</th>
                  <th className="py-3 px-4">IA & Extrações</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u: AdminUser) => {
                  const isOwner = u.email === "allysonr510@gmail.com";
                  return (
                    <tr key={u.id} className="hover:bg-surface-raised/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-muted-foreground">#{u.id}</span>
                          <p className="font-semibold">{u.email}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {u.totalQuestoes} questões • {u.simuladosCriados} simulados
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === "ROLE_ADMIN"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-surface-raised text-muted-foreground border border-border"
                          }`}>
                            {u.role === "ROLE_ADMIN" ? "ADMIN" : "CLIENTE"}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.plan === "ENTERPRISE" ? "bg-study/20 text-study border border-study/30" :
                            u.plan === "PRO" ? "bg-dash/20 text-dash border border-dash/30" :
                            "bg-surface-raised text-muted-foreground border border-border"
                          }`}>
                            {u.plan}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                          u.status === "ATIVO" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                          "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                        }`}>
                          <span className={`size-1.5 rounded-full ${
                            u.status === "ATIVO" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                          }`} />
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            u.modules.estudos ? "bg-study/20 text-study font-semibold" : "bg-surface-raised text-muted-foreground/40 line-through"
                          }`}>
                            Estudos
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            u.modules.treinos ? "bg-gym/20 text-gym font-semibold" : "bg-surface-raised text-muted-foreground/40 line-through"
                          }`}>
                            Treinos
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            u.modules.financas ? "bg-fin/20 text-fin font-semibold" : "bg-surface-raised text-muted-foreground/40 line-through"
                          }`}>
                            Finanças
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            u.modules.iaExtracao ? "bg-dash/20 text-dash font-semibold" : "bg-surface-raised text-muted-foreground/40 line-through"
                          }`}>
                            IA/PDF
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Bot className="size-3.5 text-dash" />
                          <span className="font-semibold text-foreground">
                            {u.pdfExtractCount} / {isOwner ? "∞" : u.pdfExtractLimit}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => setSelectedUserForModal(u)}
                            className="h-7 text-xs px-2 gap-1.5"
                            title="Gerenciar módulos e limites"
                          >
                            <SlidersHorizontal className="size-3 text-muted-foreground" />
                            Módulos
                          </Button>

                          {!isOwner && (
                            <Button
                              variant={u.status === "ATIVO" ? "secondary" : "primary"}
                              onClick={() => handleToggleStatus(u)}
                              disabled={statusMutation.isPending}
                              className="h-7 text-xs px-2.5"
                            >
                              {u.status === "ATIVO" ? (
                                <>
                                  <Ban className="size-3 mr-1 text-rose-400" /> Suspender
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="size-3 mr-1 text-emerald-400" /> Ativar
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AdminModulesModal
        isOpen={Boolean(selectedUserForModal)}
        user={selectedUserForModal}
        onClose={() => setSelectedUserForModal(null)}
        onSave={async (id, payload) => {
          await saveModulesMutation.mutateAsync({ id, payload });
        }}
      />
    </AppShell>
  );
}
