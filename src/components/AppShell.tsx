import { useAiChat } from "@/contexts/AiChatContext";
import { AiChatPopup, AiChatFab } from "@/components/AiChatPopup";
import { Link, useNavigate } from "@/lib/router-compat";
import { useEffect } from "react";
import { 
  Bot, 
  Brain, 
  Dumbbell, 
  LayoutDashboard, 
  ListChecks, 
  LogOut, 
  Shield, 
  User, 
  Wallet 
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loading } from "@/components/ui/Loading";
import { BottomNav } from "@/components/BottomNav";
import type { ReactNode } from "react";

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, ready, signOut } = useAuth();
  const navigate = useNavigate();
  const { openChat } = useAiChat();

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  if (!ready || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  const isMasterAdmin = 
    user.email === "allysonr510@gmail.com" || 
    user.role === "ROLE_ADMIN";

  // Se o usuário estiver suspenso, exibe aviso e bloqueia visualização
  if (user.active === false && !isMasterAdmin) {
    return (
      <div className="glow-field flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md rounded-2xl border border-destructive/40 bg-surface p-8 shadow-2xl">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/15 text-destructive mb-4">
            <Shield className="size-7" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Acesso Suspenso</h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Sua conta no <strong>Nexus</strong> está temporariamente inativa ou suspensa. Entre em contato com o suporte ou realize a regularização da sua assinatura para reativar o acesso completo.
          </p>
          <div className="mt-6">
            <button
              onClick={signOut}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface-raised px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-border transition-colors"
            >
              <LogOut className="size-4" /> Desconectar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Monta os itens de navegação baseados nas permissões REAIS do usuário
  const navItems = [
    { to: "/", label: "Hoje", icon: LayoutDashboard, accent: "text-dash", visible: true },
    { 
      to: "/estudos", 
      label: "Estudos", 
      icon: Brain, 
      accent: "text-study", 
      visible: isMasterAdmin || user.moduloEstudos !== false 
    },
    { 
      to: "/treinos", 
      label: "Treinos", 
      icon: Dumbbell, 
      accent: "text-gym", 
      visible: isMasterAdmin || user.moduloTreinos !== false 
    },
    { 
      to: "/financeiro", 
      label: "Financeiro", 
      icon: Wallet, 
      accent: "text-fin", 
      visible: isMasterAdmin || user.moduloFinancas !== false 
    },
    { to: "/tarefas", label: "Tarefas", icon: ListChecks, accent: "text-dash", visible: true },
    { 
      to: "/ia", 
      label: "IA", 
      icon: Bot, 
      accent: "text-dash", 
      visible: isMasterAdmin || user.moduloIaExtracao !== false 
    },
    { to: "/perfil", label: "Perfil", icon: User, accent: "text-muted-foreground", visible: true },
    // Apenas allysonr510@gmail.com ou ROLE_ADMIN vê o Painel Admin!
    { 
      to: "/admin", 
      label: "Admin SaaS", 
      icon: Shield, 
      accent: "text-amber-400", 
      visible: isMasterAdmin 
    },
  ].filter((item) => item.visible);

  return (
    <div className="glow-field flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden shrink-0 lg:flex lg:w-60 lg:flex-col lg:justify-between lg:border-r lg:border-border lg:bg-surface lg:px-4 lg:py-6">
        <div className="flex flex-col gap-1">
          <div className="mb-4 flex items-center justify-between px-3">
            <p className="font-display text-lg font-bold tracking-tight">Nexus</p>
            {isMasterAdmin && (
              <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-400 border border-amber-500/30">
                Master Admin
              </span>
            )}
          </div>

          {navItems.map((item) => {
            if (item.to === "/ia") {
              return (
                <button
                  key={item.to}
                  type="button"
                  onClick={() => openChat()}
                  className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground cursor-pointer"
                >
                  <item.icon className={`size-4 ${item.accent}`} />
                  {item.label}
                  <span className="ml-auto rounded-full bg-study/15 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-study border border-study/20">
                    Popup
                  </span>
                </button>
              );
            }
            return (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
                activeProps={{ className: "bg-surface-raised text-foreground font-semibold" }}
              >
                <item.icon className={`size-4 ${item.accent}`} />
                {item.label}
              </Link>
            );
          })}
        </div>

        <div>
          <p className="truncate px-3 text-xs text-muted-foreground">{user.email}</p>
          <button
            onClick={signOut}
            className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
          >
            <LogOut className="size-4" /> Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 pb-24 pt-6 sm:px-8 lg:px-10 lg:py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-7">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              {subtitle && (
                <p className="font-display text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  {subtitle}
                </p>
              )}
              <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{title}</h1>
            </div>
            {actions}
          </header>
          {children}
        </div>
      </main>

      <BottomNav items={navItems} onOpenAi={() => openChat()} />
      <AiChatFab />
      <AiChatPopup />
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  return <ErrorState error={error} compact />;
}
