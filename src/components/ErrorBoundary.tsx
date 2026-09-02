import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { RefreshCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Pega qualquer erro de render não tratado em qualquer tela e mostra uma UI de
 * fallback, em vez de deixar a página inteira em branco. Não substitui o tratamento
 * de erro de cada tela (loading/empty/error dos dados) — isso é a última rede de
 * segurança, para bugs de programação mesmo.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Erro não tratado capturado pelo ErrorBoundary:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="glow-field flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="font-display text-xl font-bold text-foreground">
            Algo deu errado nessa tela
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Não foi um erro de conexão — foi um bug mesmo. Recarregar a página costuma
            resolver; se continuar acontecendo, isso ajuda a gente a identificar o
            problema.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-lg bg-dash px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <RefreshCcw className="size-4" /> Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
