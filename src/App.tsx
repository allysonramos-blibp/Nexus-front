import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/contexts/ToastContext";
import { AiChatProvider } from "@/contexts/AiChatContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { ModuleUpgradeGuard } from "@/components/ModuleUpgradeGuard";
import { Loading } from "@/components/ui/Loading";

// Cada rota vira seu próprio chunk (code splitting) — a pessoa só baixa o código da
// tela de Estudos/Simulados/etc quando de fato navega para lá, não no carregamento inicial.
const Hoje = lazy(() => import("@/pages/index"));
const Login = lazy(() => import("@/pages/login"));
const EsqueciSenha = lazy(() => import("@/pages/esqueci-senha"));
const Financeiro = lazy(() => import("@/pages/financeiro"));
const Tarefas = lazy(() => import("@/pages/tarefas"));
const Estudo = lazy(() => import("@/pages/estudo"));
const Treinos = lazy(() => import("@/pages/treinos"));
const Ia = lazy(() => import("@/pages/ia"));
const Perfil = lazy(() => import("@/pages/perfil"));
const PlanosPrecos = lazy(() => import("@/pages/planos"));
const Admin = lazy(() => import("@/pages/admin"));
const Planos = lazy(() => import("@/pages/estudos/Planos"));
const PlanoDetalhe = lazy(() => import("@/pages/estudos/PlanoDetalhe"));
const Questoes = lazy(() => import("@/pages/estudos/Questoes"));
const CadernoDeErros = lazy(() => import("@/pages/estudos/CadernoDeErros"));
const Revisoes = lazy(() => import("@/pages/estudos/Revisoes"));
const Simulados = lazy(() => import("@/pages/estudos/Simulados"));
const SimuladoDetalhe = lazy(() => import("@/pages/estudos/SimuladoDetalhe"));
const Desempenho = lazy(() => import("@/pages/estudos/Desempenho"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Evita refetch imediato toda vez que a pessoa volta pra uma tela já visitada
      // há pouco — os dados continuam "frescos" por 30s antes de buscar de novo.
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loading />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AiChatProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Hoje />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/financeiro"
                  element={
                    <ProtectedRoute>
                      <ModuleUpgradeGuard moduleKey="financas">
                        <Financeiro />
                      </ModuleUpgradeGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tarefas"
                  element={
                    <ProtectedRoute>
                      <Tarefas />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudo"
                  element={
                    <ProtectedRoute>
                      <ModuleUpgradeGuard moduleKey="estudos">
                        <Estudo />
                      </ModuleUpgradeGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos"
                  element={
                    <ProtectedRoute>
                      <ModuleUpgradeGuard moduleKey="estudos">
                        <Planos />
                      </ModuleUpgradeGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/planos/:id"
                  element={
                    <ProtectedRoute>
                      <ModuleUpgradeGuard moduleKey="estudos">
                        <PlanoDetalhe />
                      </ModuleUpgradeGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/questoes"
                  element={
                    <ProtectedRoute>
                      <ModuleUpgradeGuard moduleKey="estudos">
                        <Questoes />
                      </ModuleUpgradeGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/caderno-erros"
                  element={
                    <ProtectedRoute>
                      <ModuleUpgradeGuard moduleKey="estudos">
                        <CadernoDeErros />
                      </ModuleUpgradeGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/revisoes"
                  element={
                    <ProtectedRoute>
                      <ModuleUpgradeGuard moduleKey="estudos">
                        <Revisoes />
                      </ModuleUpgradeGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/simulados"
                  element={
                    <ProtectedRoute>
                      <ModuleUpgradeGuard moduleKey="estudos">
                        <Simulados />
                      </ModuleUpgradeGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/simulados/:id"
                  element={
                    <ProtectedRoute>
                      <ModuleUpgradeGuard moduleKey="estudos">
                        <SimuladoDetalhe />
                      </ModuleUpgradeGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/desempenho"
                  element={
                    <ProtectedRoute>
                      <ModuleUpgradeGuard moduleKey="estudos">
                        <Desempenho />
                      </ModuleUpgradeGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/treinos"
                  element={
                    <ProtectedRoute>
                      <ModuleUpgradeGuard moduleKey="treinos">
                        <Treinos />
                      </ModuleUpgradeGuard>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ia"
                  element={
                    <ProtectedRoute>
                      <Ia />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/planos"
                  element={
                    <ProtectedRoute>
                      <PlanosPrecos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/perfil"
                  element={
                    <ProtectedRoute>
                      <Perfil />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  }
                />
                <Route
                  path="*"
                  element={
                    <ProtectedRoute>
                      <Hoje />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </AiChatProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
