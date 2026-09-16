import { useState } from "react";
import { CircleUserRound, CheckCircle2, XCircle, LogOut, Shield, Sparkles, FileText, BellRing } from "lucide-react";
import { ExecutiveReportModal } from "@/components/ExecutiveReportModal";
import { NotificationCenterModal } from "@/components/NotificationCenterModal";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function PerfilPage() {
  const { user, signOut } = useAuth();

  const [reportOpen, setReportOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const isMasterAdmin =
    user?.email === "allysonr510@gmail.com" || user?.role === "ROLE_ADMIN";

  return (
    <AppShell title="Perfil & Assinatura" subtitle="Sua conta">
      {/* Dados do Usuário */}
      <Card className="flex items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-dash/15 text-dash">
          <CircleUserRound className="size-7" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-display text-lg font-semibold text-foreground truncate">{user?.email}</p>
            {isMasterAdmin && (
              <Badge variant="warning">Master Admin</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">ID do Usuário: #{user?.id}</p>
        </div>
      </Card>

      {/* Plano e Assinatura */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-study" />
            <div>
              <p className="text-sm font-semibold text-foreground">Plano de Assinatura</p>
              <p className="text-xs text-muted-foreground">Status da sua conta comercial</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={user?.plan === "ENTERPRISE" ? "warning" : user?.plan === "PRO" ? "info" : "default"}>
              {user?.plan || "PRO"}
            </Badge>
            <a href="/planos" className="inline-flex items-center gap-1 text-xs font-semibold text-dash hover:underline">
              Mudar de Plano <Sparkles className="size-3" />
            </a>
          </div>
        </div>

        {/* Grade de Módulos Liberados para Este Usuário */}
        <div className="pt-2 border-t border-border/60">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
            Módulos Contratados na sua Assinatura:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-surface-raised/50">
              <span className="font-medium text-foreground">Estudos & Simulados</span>
              {user?.moduloEstudos !== false || isMasterAdmin ? (
                <span className="text-fin flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="size-3.5" /> Liberado
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-1 font-semibold">
                  <XCircle className="size-3.5" /> Bloqueado
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-surface-raised/50">
              <span className="font-medium text-foreground">Treinos & Musculação</span>
              {user?.moduloTreinos !== false || isMasterAdmin ? (
                <span className="text-fin flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="size-3.5" /> Liberado
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-1 font-semibold">
                  <XCircle className="size-3.5" /> Bloqueado
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-surface-raised/50">
              <span className="font-medium text-foreground">Finanças Pessoais</span>
              {user?.moduloFinancas !== false || isMasterAdmin ? (
                <span className="text-fin flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="size-3.5" /> Liberado
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-1 font-semibold">
                  <XCircle className="size-3.5" /> Bloqueado
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-surface-raised/50">
              <span className="font-medium text-foreground">Tutor de IA & PDF Parser</span>
              {user?.moduloIaExtracao !== false || isMasterAdmin ? (
                <span className="text-fin flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="size-3.5" /> Liberado
                </span>
              ) : (
                <span className="text-destructive flex items-center gap-1 font-semibold">
                  <XCircle className="size-3.5" /> Bloqueado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Consumo de Créditos de IA */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Créditos de extração de PDF utilizados:</span>
          <span className="font-semibold text-foreground">
            {user?.pdfExtractCount ?? 0} / {user?.pdfExtractLimit ?? 50}
          </span>
        </div>
      </Card>

      {/* Relatórios & Notificações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-dash/10 text-dash">
              <FileText className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Relatório Executivo (PDF)</h3>
              <p className="text-xs text-muted-foreground">Documento consolidado de desempenho</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Gere um relatório completo em PDF com 1 clique para acompanhar seus estudos, tarefas, treinos e finanças.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setReportOpen(true)}
            className="w-full text-xs gap-1.5"
          >
            <FileText className="size-3.5 text-dash" /> Gerar Relatório em PDF
          </Button>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-study/10 text-study">
              <BellRing className="size-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Central de Lembretes & Push</h3>
              <p className="text-xs text-muted-foreground">Notificações no celular e navegador</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Configure alertas diários para não perder suas metas de questões, revisões espaçadas e tarefas críticas.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotificationsOpen(true)}
            className="w-full text-xs gap-1.5"
          >
            <BellRing className="size-3.5 text-study" /> Configurar Notificações
          </Button>
        </Card>
      </div>

      {/* Segurança & Sessão */}
      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="size-4 text-dash" />
          <h3 className="text-sm font-semibold text-foreground">Segurança da Conta</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Sua sessão é protegida com criptografia ponta a ponta e autenticação stateless JWT.
          Seus dados são isolados e associados exclusivamente ao seu identificador de conta.
        </p>
      </Card>

      <Button variant="outline" onClick={signOut} className="self-start text-destructive hover:bg-destructive/10">
        <LogOut className="size-4 mr-1.5" /> Desconectar da conta
      </Button>
      <ExecutiveReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
      <NotificationCenterModal isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </AppShell>
  );
}

export default PerfilPage;
