import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorState } from "@/components/ui/ErrorState";

function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";


  useEffect(() => {
    if (ready && user) navigate(redirectTo, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        // POST /users/register não emite token — só cria a conta. Login é chamado
        // logo em seguida para o usuário já sair autenticado do cadastro.
        try {
          await api.register(email, password);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Falha ao cadastrar");
          return;
        }
        try {
          const auth = await api.login(email, password);
          signIn(auth);
          toast("Conta criada com sucesso!", "success");
          navigate(redirectTo, { replace: true });
        } catch {
          // Conta criada, mas o login automático falhou (ex.: API instável) — não trava o
          // usuário: ele só precisa tentar entrar manualmente com a conta já criada.
          setMode("login");
          setError("Conta criada! Agora entre com o e-mail e a senha cadastrados.");
        }
        return;
      }

      const auth = await api.login(email, password);
      signIn(auth);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="glow-field flex min-h-screen items-center justify-center px-5 py-12">
      <div className="panel w-full max-w-sm p-7">
        <p className="font-display text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Nexus
        </p>
        <h1 className="mt-2 text-2xl font-bold">
          {mode === "login" ? "Entrar" : "Criar conta"}
        </h1>

        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <Input
            label="E-mail"
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Senha"
            id="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 8 : undefined}
            hint={mode === "register" ? "Mínimo de 8 caracteres." : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {mode === "login" && (
            <button
              type="button"
              onClick={() => navigate("/esqueci-senha")}
              className="self-end text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Esqueci minha senha
            </button>
          )}

          {error && <ErrorState error={new Error(error)} compact />}

          <Button type="submit" loading={loading} className="mt-2 w-full">
            {mode === "login" ? "Entrar" : "Cadastrar"}
          </Button>
        </form>


        <button
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="mt-4 w-full text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
        </button>
      </div>
    </main>
  );
}

export default LoginPage;
