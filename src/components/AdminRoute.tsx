import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/ui/Loading";

/**
 * Guarda rigorosa para a rota de administração (/admin).
 * Apenas 'allysonr510@gmail.com' ou usuários com role 'ROLE_ADMIN'
 * são autorizados a carregar e visualizar esta tela.
 * Qualquer outro usuário é redirecionado instantaneamente para a home (/),
 * impedindo vazamento de dados de outros usuários ou painel de controle.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isMasterAdmin =
    user.email === "allysonr510@gmail.com" || user.role === "ROLE_ADMIN";

  if (!isMasterAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
