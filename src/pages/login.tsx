import { useEffect, useId, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Target,
  Brain,
  Wallet,
  Dumbbell,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/contexts/ToastContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ErrorState } from "@/components/ui/ErrorState";

const REMEMBER_EMAIL_KEY = "nexus_remembered_email";

function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const rememberMeId = useId();

  const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";

  useEffect(() => {
    try {
      const authMsg = sessionStorage.getItem("nexus_auth_message");
      if (authMsg) {
        setError(authMsg);
        sessionStorage.removeItem("nexus_auth_message");
      }
      const saved = localStorage.getItem(REMEMBER_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        setRememberMe(true);
      }
    } catch {

    }
  }, []);

  useEffect(() => {
    if (ready && user) navigate(redirectTo, { replace: true });

  }, [ready, user]);

  const passwordStrength = (() => {
    if (!password) return { score: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: "Fraca", color: "bg-red-500", text: "text-red-400" };
    if (score === 2) return { score: 2, label: "Razoável", color: "bg-amber-500", text: "text-amber-400" };
    if (score === 3) return { score: 3, label: "Boa", color: "bg-blue-500", text: "text-blue-400" };
    return { score: 4, label: "Forte", color: "bg-emerald-500", text: "text-emerald-400" };
  })();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {

      try {
        if (rememberMe && email) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {

      }

      if (mode === "register") {
        try {
          await api.register(email, password);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Falha ao cadastrar conta");
          return;
        }
        try {
          const auth = await api.login(email, password);
          signIn(auth);
          toast("Conta criada com sucesso! Bem-vindo ao Nexus.", "success");
          navigate(redirectTo, { replace: true });
        } catch {
          setMode("login");
          setError("Conta criada com sucesso! Entre agora com seu e-mail e senha.");
        }
        return;
      }

      const auth = await api.login(email, password);
      signIn(auth);
      toast("Acesso autorizado. Bom trabalho!", "success");
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="glow-field relative flex min-h-screen items-center justify-center p-4 sm:p-6 lg:p-10">

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-dash/10 blur-[130px] rounded-full opacity-60" />
      </div>

      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-border/80 bg-surface/95 shadow-2xl backdrop-blur-md grid grid-cols-1 md:grid-cols-12">

        <div className="hidden md:flex md:col-span-5 flex-col justify-between p-8 lg:p-10 bg-gradient-to-b from-surface-raised/90 to-surface/90 border-r border-border/60 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-dash/15 text-dash ring-1 ring-dash/30 shadow-inner">
                <Sparkles className="size-5" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                Nexus
              </span>
            </div>

            <div className="mt-8">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-dash/30 bg-dash/10 px-3 py-1 text-xs font-semibold text-dash">
                <ShieldCheck className="size-3.5" /> Alta Performance
              </span>
              <h2 className="mt-4 font-display text-2xl font-bold leading-tight text-foreground">
                Sua rotina, estudos e metas sob controle total.
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                O ecossistema completo planejado para quem busca aprovação, saúde física e estabilidade financeira.
              </p>
            </div>

            <div className="mt-7 flex flex-col gap-3 text-xs">
              <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-surface/60 p-2.5">
                <div className="flex size-7 items-center justify-center rounded-md bg-dash/15 text-dash">
                  <Target className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Foco do Dia</p>
                  <p className="text-[11px] text-muted-foreground">Priorização clara sem paralisia por análise.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-study/30 bg-study/5 p-2.5">
                <div className="flex size-7 items-center justify-center rounded-md bg-study/20 text-study">
                  <Brain className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Edital & Caderno de Erros</p>
                  <p className="text-[11px] text-muted-foreground">Memorização ativa e questões com IA.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-fin/30 bg-fin/5 p-2.5">
                <div className="flex size-7 items-center justify-center rounded-md bg-fin/20 text-fin">
                  <Wallet className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Finanças Pessoais</p>
                  <p className="text-[11px] text-muted-foreground">Saldo, fluxo de caixa e relatórios executivos.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-gym/30 bg-gym/5 p-2.5">
                <div className="flex size-7 items-center justify-center rounded-md bg-gym/20 text-gym">
                  <Dumbbell className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Consistência Física</p>
                  <p className="text-[11px] text-muted-foreground">Metas semanais e histórico de treinos.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Nexus v1.0.0</span>
            <span className="inline-flex items-center gap-1 text-dash font-medium">
              Foco & Disciplina <ArrowRight className="size-3" />
            </span>
          </div>
        </div>

        <div className="col-span-1 md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>

            <div className="md:hidden flex items-center gap-2 mb-6">
              <div className="flex size-8 items-center justify-center rounded-lg bg-dash/15 text-dash ring-1 ring-dash/30">
                <Sparkles className="size-4" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-foreground">
                Nexus
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-raised p-1 border border-border">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === "login"
                    ? "bg-dash text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === "register"
                    ? "bg-dash text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Criar conta
              </button>
            </div>

            <div className="mt-6">
              <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
                {mode === "login" ? "Bem-vindo de volta!" : "Crie sua conta"}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                {mode === "login"
                  ? "Insira seus dados para acessar o seu painel de controle."
                  : "Comece agora a organizar seus estudos, rotina e finanças."}
              </p>
            </div>

            <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
              <Input
                label="E-mail"
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftElement={<Mail className="size-4" />}
              />

              <div className="flex flex-col gap-1.5">
                <Input
                  label="Senha"
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={mode === "register" ? 8 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftElement={<Lock className="size-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title={showPassword ? "Ocultar senha" : "Ver senha"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  }
                />

                {mode === "register" && password && (
                  <div className="mt-1 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">Força da senha:</span>
                      <span className={`font-semibold ${passwordStrength.text}`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-surface-raised rounded-full overflow-hidden">
                      <div className={`h-full ${passwordStrength.score >= 1 ? passwordStrength.color : "bg-transparent"}`} />
                      <div className={`h-full ${passwordStrength.score >= 2 ? passwordStrength.color : "bg-transparent"}`} />
                      <div className={`h-full ${passwordStrength.score >= 3 ? passwordStrength.color : "bg-transparent"}`} />
                      <div className={`h-full ${passwordStrength.score >= 4 ? passwordStrength.color : "bg-transparent"}`} />
                    </div>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="size-3 text-dash shrink-0" />
                      Mínimo de 8 caracteres para maior segurança.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label
                  htmlFor={rememberMeId}
                  className="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition-colors select-none"
                >
                  <input
                    id={rememberMeId}
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-4 rounded border-border bg-surface-raised text-dash focus:ring-dash focus:ring-offset-0 cursor-pointer accent-blue-600"
                  />
                  <span>Lembrar meu e-mail</span>
                </label>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => navigate("/esqueci-senha")}
                    className="text-dash hover:underline font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>

              {error && <ErrorState error={new Error(error)} compact />}

              <Button
                type="submit"
                loading={loading}
                className="mt-2 w-full bg-dash hover:opacity-90 text-white font-semibold py-2.5 shadow-md transition-all"
              >
                {loading
                  ? mode === "login"
                    ? "Entrando..."
                    : "Criando sua conta..."
                  : mode === "login"
                  ? "Entrar no Nexus"
                  : "Criar Conta Grátis"}
              </Button>
            </form>
          </div>

          <div className="mt-8 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
            {mode === "login" ? (
              <p>
                Ainda não tem conta?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("register");
                    setError(null);
                  }}
                  className="text-dash font-semibold hover:underline"
                >
                  Cadastre-se gratuitamente
                </button>
              </p>
            ) : (
              <p>
                Já possui uma conta ativa?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="text-dash font-semibold hover:underline"
                >
                  Faça login aqui
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default LoginPage;
