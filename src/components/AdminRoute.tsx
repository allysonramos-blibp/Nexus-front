import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { Loading } from "@/components/ui/Loading";

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
