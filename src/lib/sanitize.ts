/**
 * Utilitários de segurança para sanitização e validação de dados
 * Previne ataques de injeção de script (XSS) e formatação inadequada
 * antes de enviar para as APIs ou exibir na interface.
 */

/**
 * Remove caracteres de controle perigosos e tags HTML simples de strings de input.
 */
export function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .replace(/[<>]/g, "") // remove tags diretas
    .trim();
}

/**
 * Validação rigorosa de formato de e-mail.
 */
export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Validação de integridade de senha (mínimo 6 caracteres para usuários).
 */
export function isStrongPassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 6) {
    return { valid: false, message: "A senha deve conter no mínimo 6 caracteres." };
  }
  return { valid: true };
}
