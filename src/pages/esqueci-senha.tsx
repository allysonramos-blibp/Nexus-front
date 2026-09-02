import { useNavigate } from "react-router-dom";
import { MailQuestion } from "lucide-react";
import { Button } from "@/components/ui/Button";

/**
 * A API do Nexus ainda não expõe um endpoint de recuperação de senha
 * (não existe nada além de POST /api/auth/login e POST /api/users/register).
 * Esta tela só comunica a limitação — nenhuma chamada de API é inventada aqui.
 */
function EsqueciSenhaPage() {
  const navigate = useNavigate();

  return (
    <main className="glow-field flex min-h-screen items-center justify-center px-5 py-12">
      <div className="panel w-full max-w-sm p-7 text-center">
        <MailQuestion className="mx-auto size-8 text-dash" />
        <h1 className="mt-4 text-xl font-bold">Recuperação de senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esse recurso ainda não está disponível — o backend do Nexus ainda não tem um
          endpoint para redefinição de senha. Assim que estiver pronto no servidor, essa
          tela passa a funcionar de verdade.
        </p>
        <Button variant="outline" className="mt-6 w-full" onClick={() => navigate("/login")}>
          Voltar para o login
        </Button>
      </div>
    </main>
  );
}

export default EsqueciSenhaPage;
