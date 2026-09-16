import { CircleUserRound, CheckCircle2, XCircle, LogOut, Shield, Sparkles, KeyRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function PerfilPage() {
  const { user, signOut } = useAuth();

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
          <Badge variant={user?.plan === "ENTERPRISE" ? "warning" : user?.plan === "PRO" ? "info" : "default"}>
            {user?.plan || "PRO"}
          </Badge>
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
    </AppShell>
  );
}

export default PerfilPage;
