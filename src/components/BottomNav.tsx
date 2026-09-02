import { Link } from "@/lib/router-compat";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

/**
 * Barra de navegação inferior fixa, só visível abaixo do breakpoint lg (onde o
 * AppShell some com a sidebar). Ícone + rótulo minúsculo — com 7 itens, texto maior
 * não cabe confortavelmente numa tela de ~375-390px.
 */
export function BottomNav({ items }: { items: readonly NavItem[] }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {items.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.to === "/" }}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium text-muted-foreground transition-colors"
          activeProps={{ className: "text-foreground" }}
        >
          <item.icon className={`size-5 ${item.accent}`} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
