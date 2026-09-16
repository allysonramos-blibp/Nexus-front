import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api";

export default function EsqueciSenhaPage() {
  const navigate = useNavigate();

  // Etapa 1: Solicitar código | Etapa 2: Validar código e trocar senha | Etapa 3: Sucesso
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devCodeHint, setDevCodeHint] = useState<string | null>(null);

  // Solicitar o código de redefinição
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDevCodeHint(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Por favor, informe um endereço de e-mail válido.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.forgotPassword(cleanEmail);
      if (res.code) {
        // Exibe o código na tela para permitir teste ou contingência caso não haja servidor SMTP
        setDevCodeHint(res.code);
        setToken(res.code);
      }
      setStep(2);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Falha ao solicitar recuperação de senha.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Enviar a nova senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError("Por favor, digite o código de 6 dígitos que foi gerado.");
      return;
    }

    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas digitadas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword(email.trim().toLowerCase(), token.trim(), newPassword);
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Código inválido ou expirado. Tente novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="glow-field flex min-h-screen items-center justify-center px-4 py-12">
      <div className="panel w-full max-w-md p-6 sm:p-8">
        {step === 1 && (
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-dash/10 text-dash border border-dash/20">
                <Mail className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Recuperar Senha</h1>
                <p className="text-xs text-muted-foreground">Informe o e-mail cadastrado na sua conta</p>
              </div>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRequestReset} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  E-mail da sua conta
                </label>
                <div className="relative">
                  <Input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    autoFocus
                  />
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Um código de validação de 6 dígitos será gerado com validade de 15 minutos.
                </p>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Gerando código..." : "Continuar"}
              </Button>
            </form>

            <div className="mt-6 border-t border-border/60 pt-4 text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Lembrei minha senha, voltar ao login
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-dash/10 text-dash border border-dash/20">
                <KeyRound className="size-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Código & Nova Senha</h1>
                <p className="text-xs text-muted-foreground">Para: <strong className="text-foreground">{email}</strong></p>
              </div>
            </div>

            {devCodeHint && (
              <div className="mt-4 rounded-lg border border-dash/30 bg-dash/10 p-3.5 text-xs">
                <div className="flex items-center gap-2 font-semibold text-dash">
                  <Sparkles className="size-4 shrink-0" />
                  <span>Código de Verificação Gerado:</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <span className="font-mono text-lg font-bold tracking-widest text-foreground">
                    {devCodeHint}
                  </span>
                  <span className="text-[10px] text-muted-foreground">Válido por 15 minutos</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Código de 6 dígitos
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Ex: 123456"
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                    className="font-mono text-center tracking-widest font-bold text-base"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Nova senha (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-9"
                  />
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-9"
                  />
                  <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Redefinindo senha..." : "Salvar Nova Senha"}
              </Button>
            </form>

            <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Trocar e-mail
              </button>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Voltar ao login
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="text-center py-4">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="size-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight">Senha Atualizada!</h2>
            <p className="mt-2 text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Sua senha foi redefinida com sucesso com criptografia segura. Você já pode acessar sua conta normalmente.
            </p>

            <Button
              className="mt-6 w-full"
              onClick={() => navigate("/login")}
            >
              Fazer Login com a Nova Senha
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
