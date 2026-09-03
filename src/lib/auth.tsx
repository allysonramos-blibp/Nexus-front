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
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
}

const AuthContext =
  createContext<AuthState | null>(null);

function readStoredUser(): UserResponse | null {
  try {
    const expiresAtRaw =
      window.localStorage.getItem(
        EXPIRES_AT_STORAGE_KEY,
      );

    const expiresAt = expiresAtRaw
      ? Number(expiresAtRaw)
      : null;

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

    const parsed: unknown =
      JSON.parse(raw);

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

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<UserResponse | null>(null);

  const [ready, setReady] =
    useState(false);

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

  useEffect(() => {
    const storedUser =
      readStoredUser();

    setUser(storedUser);
    setReady(true);
  }, []);

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

    if (msLeft <= 0) {
      signOut();
      return;
    }

    const timer =
      window.setTimeout(() => {
        signOut();
      }, msLeft);

    return () => {
      window.clearTimeout(timer);
    };
  }, [user, signOut]);

  const signIn = useCallback(
    (auth: AuthResponse) => {
      setAuthToken(auth.token);

      window.localStorage.setItem(
        USER_STORAGE_KEY,
        JSON.stringify(auth.user),
      );

      const expiresAt =
        Date.now() +
        auth.expiresInMs;

      window.localStorage.setItem(
        EXPIRES_AT_STORAGE_KEY,
        String(expiresAt),
      );

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

export function useAuth(): AuthState {
  const ctx =
    useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      "useAuth precisa estar dentro de <AuthProvider>",
    );
  }

  return ctx;
}