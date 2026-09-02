import { CircleUserRound, Info, LogOut, Palette, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

function PerfilPage() {
  const { user, signOut } = useAuth();

  return (
    <AppShell title="Perfil" subtitle="Sua conta">
      <Card className="flex items-center gap-4">
        <span className="flex size-14 items-center justify-center rounded-full bg-dash/15 text-dash">
          <CircleUserRound className="size-7" />
        </span>
        <div>
          <p className="font-display text-lg font-semibold text-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground">ID da conta: {user?.id}</p>
        </div>
      </Card>

      <Card className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-study" />
          <div>
            <p className="text-sm font-medium text-foreground">Plano atual</p>
            <p className="text-xs text-muted-foreground">Cobrança ainda não está ativa no Nexus.</p>
          </div>
        </div>
        <Badge variant="info">Free</Badge>
      </Card>

      <Card className="flex items-start gap-3">
        <Palette className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium text-foreground">Preferências e aparência</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            O backend já tem os modelos para tema, idioma, notificações e fuso horário, mas
            ainda não expõe um endpoint para lê-los ou alterá-los — por isso essa seção não
            está aqui ainda. Assim que existir <code>GET/PUT /api/users/me/preferences</code>{" "}
            (ou similar), essa tela passa a editar isso de verdade.
          </p>
        </div>
      </Card>

      <Card className="flex items-start gap-3 border-dash/20 bg-dash/5">
        <Info className="mt-0.5 size-4 shrink-0 text-dash" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Esta tela mostra só o que já está disponível na sua sessão — o backend ainda não
          tem um endpoint de perfil (<code>GET /api/users/me</code>) para nome completo, bio,
          foto ou data de nascimento, embora o modelo <code>Profile</code> já exista.
        </p>
      </Card>

      <Button variant="outline" onClick={signOut} className="self-start">
        <LogOut className="size-4" /> Sair da conta
      </Button>
    </AppShell>
  );
}

export default PerfilPage;
