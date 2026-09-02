import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/ui/Loading";

/**
 * Envolve rotas que exigem sessão ativa. Sem usuário autenticado, redireciona para
 * /login (guardando a rota de origem em `state.from` para um futuro "voltar para onde estava").
 * `AppShell` mantém a checagem própria como segunda camada de defesa — não faz mal ser redundante aqui.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
