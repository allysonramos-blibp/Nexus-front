

export function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .replace(/[<>]/g, "")
    .trim();
}

export function isValidEmail(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

export function isStrongPassword(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 6) {
    return { valid: false, message: "A senha deve conter no mínimo 6 caracteres." };
  }
  return { valid: true };
}
