import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

import {
  UNAUTHORIZED_EVENT,
  clearAuthToken,
  setAuthToken,
  type AuthResponse,
  type UserResponse,
} from "./api";

const USER_STORAGE_KEY = "nexus.user";
const EXPIRES_AT_STORAGE_KEY = "nexus.expiresAt";

interface AuthState {
  user: UserResponse | null;
  ready: boolean;

  /**
   * Recebe a resposta completa do login
   * e inicia a sessão.
   */
  signIn: (auth: AuthResponse) => void;

  /**
   * Encerra a sessão.
   */
  signOut: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Recupera o usuário salvo no navegador.
 */
function readStoredUser(): UserResponse | null {
  try {
    const expiresAtRaw =
      window.localStorage.getItem(
        EXPIRES_AT_STORAGE_KEY,
      );

    const expiresAt = expiresAtRaw
      ? Number(expiresAtRaw)
      : null;

    /**
     * Se existe uma data de expiração
     * e ela já passou, a sessão é inválida.
     */
    if (
      expiresAt !== null &&
      Number.isFinite(expiresAt) &&
      Date.now() >= expiresAt
    ) {
      clearAuthToken();

      window.localStorage.removeItem(
        USER_STORAGE_KEY,
      );

      window.localStorage.removeItem(
        EXPIRES_AT_STORAGE_KEY,
      );

      return null;
    }

    const raw =
      window.localStorage.getItem(
        USER_STORAGE_KEY,
      );

    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);

    /**
     * Validação mínima para evitar colocar
     * dados inválidos no estado de autenticação.
     */
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("id" in parsed) ||
      !("email" in parsed)
    ) {
      window.localStorage.removeItem(
        USER_STORAGE_KEY,
      );

      return null;
    }

    return parsed as UserResponse;
  } catch {
    return null;
  }
}

/**
 * Provider global de autenticação.
 */
export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<UserResponse | null>(null);

  const [ready, setReady] =
    useState(false);

  /**
   * Encerra a sessão completamente.
   */
  const signOut = useCallback(() => {
    clearAuthToken();

    window.localStorage.removeItem(
      USER_STORAGE_KEY,
    );

    window.localStorage.removeItem(
      EXPIRES_AT_STORAGE_KEY,
    );

    setUser(null);
  }, []);

  /**
   * Restaura a sessão quando o aplicativo inicia.
   */
  useEffect(() => {
    const storedUser = readStoredUser();

    setUser(storedUser);
    setReady(true);
  }, []);

  /**
   * Qualquer resposta HTTP 401
   * encerra automaticamente a sessão.
   */
  useEffect(() => {
    const handler = () => {
      signOut();
    };

    window.addEventListener(
      UNAUTHORIZED_EVENT,
      handler,
    );

    return () => {
      window.removeEventListener(
        UNAUTHORIZED_EVENT,
        handler,
      );
    };
  }, [signOut]);

  /**
   * Monitora a expiração do JWT
   * enquanto o aplicativo está aberto.
   */
  useEffect(() => {
    if (!user) {
      return;
    }

    const expiresAtRaw =
      window.localStorage.getItem(
        EXPIRES_AT_STORAGE_KEY,
      );

    const expiresAt = expiresAtRaw
      ? Number(expiresAtRaw)
      : null;

    if (
      expiresAt === null ||
      !Number.isFinite(expiresAt)
    ) {
      return;
    }

    const msLeft =
      expiresAt - Date.now();

    /**
     * Já expirou.
     */
    if (msLeft <= 0) {
      signOut();
      return;
    }

    /**
     * Agenda logout automático.
     */
    const timer = window.setTimeout(() => {
      signOut();
    }, msLeft);

    return () => {
      window.clearTimeout(timer);
    };
  }, [user, signOut]);

  /**
   * Inicia uma sessão.
   */
  const signIn = useCallback(
    (auth: AuthResponse) => {
      /**
       * Salva JWT.
       */
      setAuthToken(auth.token);

      /**
       * Salva usuário.
       */
      window.localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(auth.user),
      );

      /**
       * Calcula a data absoluta de expiração.
       */
      const expiresAt =
        Date.now() + auth.expiresInMs;

      window.localStorage.setItem(
        EXPIRES_AT_STORAGE_KEY,
        String(expiresAt),
      );

      /**
       * Atualiza estado React.
       */
      setUser(auth.user);
    },
    [],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      signIn,
      signOut,
    }),
    [
      user,
      ready,
      signIn,
      signOut,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acessar autenticação.
 */
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth precisa estar dentro de <AuthProvider>",
    );
  }

  return ctx;
}