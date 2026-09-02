import { Link, useNavigate } from "@/lib/router-compat";
import { useEffect } from "react";
import { Bot, Brain, Dumbbell, LayoutDashboard, ListChecks, LogOut, User, Wallet } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ErrorState } from "@/components/ui/ErrorState";
import { Loading } from "@/components/ui/Loading";
import { BottomNav } from "@/components/BottomNav";
import type { ReactNode } from "react";

const nav = [
  { to: "/", label: "Hoje", icon: LayoutDashboard, accent: "text-dash" },
  { to: "/financeiro", label: "Financeiro", icon: Wallet, accent: "text-fin" },
  { to: "/tarefas", label: "Tarefas", icon: ListChecks, accent: "text-dash" },
  { to: "/estudos", label: "Estudos", icon: Brain, accent: "text-study" },
  { to: "/treinos", label: "Treinos", icon: Dumbbell, accent: "text-gym" },
  { to: "/ia", label: "IA", icon: Bot, accent: "text-dash" },
  { to: "/perfil", label: "Perfil", icon: User, accent: "text-muted-foreground" },
] as const;

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

  return (
    <div className="glow-field flex min-h-screen flex-col lg:flex-row">
      <aside className="hidden shrink-0 lg:flex lg:w-60 lg:flex-col lg:justify-between lg:border-r lg:border-border lg:bg-surface lg:px-4 lg:py-6">
        <div className="flex flex-col gap-1">
          <p className="mb-4 font-display text-lg font-bold tracking-tight">Nexus</p>
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
              activeProps={{ className: "bg-surface-raised text-foreground" }}
            >
              <item.icon className={`size-4 ${item.accent}`} />
              {item.label}
            </Link>
          ))}
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

      <BottomNav items={nav} />
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  return <ErrorState error={error} compact />;
}
