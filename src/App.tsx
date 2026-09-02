import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { ToastProvider } from "@/contexts/ToastContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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
                      <Financeiro />
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
                      <Estudo />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos"
                  element={
                    <ProtectedRoute>
                      <Planos />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/planos/:id"
                  element={
                    <ProtectedRoute>
                      <PlanoDetalhe />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/questoes"
                  element={
                    <ProtectedRoute>
                      <Questoes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/caderno-erros"
                  element={
                    <ProtectedRoute>
                      <CadernoDeErros />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/revisoes"
                  element={
                    <ProtectedRoute>
                      <Revisoes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/simulados"
                  element={
                    <ProtectedRoute>
                      <Simulados />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/simulados/:id"
                  element={
                    <ProtectedRoute>
                      <SimuladoDetalhe />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/estudos/desempenho"
                  element={
                    <ProtectedRoute>
                      <Desempenho />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/treinos"
                  element={
                    <ProtectedRoute>
                      <Treinos />
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
                  path="/perfil"
                  element={
                    <ProtectedRoute>
                      <Perfil />
                    </ProtectedRoute>
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
      </ToastProvider>
    </QueryClientProvider>
  );
}
