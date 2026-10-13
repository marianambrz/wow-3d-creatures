import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/server/auth";

const betterAuthClient = createAuthClient({ plugins: [inferAdditionalFields<typeof auth>()] });
const useLocalSQLite = import.meta.env.DEV && import.meta.env.VITE_USE_SQLITE !== "false";
const apiBase = import.meta.env.VITE_SQLITE_API_URL || "http://127.0.0.1:3000";
const sessionKey = "animal-controller-sqlite-session";

type User = { id: string | number; email: string; name?: string; role?: string; councilNumber?: string };
type Result<T> = { data: T | null; error: { message?: string } | null };
type SessionResult = Result<{ user: User }>;
type AuthResult = Result<{ user: User }>;

async function sqliteRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = window.localStorage.getItem(sessionKey);
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(payload.error || `Falha na API local (${response.status})`);
  }
  return (response.status === 204 ? null : response.json()) as Promise<T>;
}

function errorResult<T>(error: unknown): Result<T> {
  return { data: null, error: { message: error instanceof Error ? error.message : "Falha ao conectar à API local." } };
}

export const authClient = {
  async getSession(): Promise<SessionResult> {
    if (!useLocalSQLite) return await betterAuthClient.getSession() as unknown as SessionResult;
    const token = window.localStorage.getItem(sessionKey);
    if (!token) return { data: null, error: null };
    try { return { data: { user: await sqliteRequest<User>("/api/me") }, error: null }; }
    catch (error) { window.localStorage.removeItem(sessionKey); return errorResult(error); }
  },
  async signInEmail(input: { email: string; password: string }): Promise<AuthResult> {
    if (!useLocalSQLite) return await betterAuthClient.signIn.email(input) as unknown as AuthResult;
    try {
      const result = await sqliteRequest<{ token: string; user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(input) });
      window.localStorage.setItem(sessionKey, result.token);
      return { data: { user: result.user }, error: null };
    } catch (error) { return errorResult(error); }
  },
  async signUpEmail(input: { email: string; password: string; name: string; role: string; councilNumber: string }): Promise<AuthResult> {
    if (!useLocalSQLite) return await betterAuthClient.signUp.email(input as Parameters<typeof betterAuthClient.signUp.email>[0]) as unknown as AuthResult;
    try {
      const result = await sqliteRequest<{ token: string; user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(input) });
      window.localStorage.setItem(sessionKey, result.token);
      return { data: { user: result.user }, error: null };
    } catch (error) { return errorResult(error); }
  },
  async requestPasswordReset(input: { email: string; redirectTo: string }): Promise<Result<null>> {
    if (!useLocalSQLite) return await betterAuthClient.requestPasswordReset(input) as unknown as Result<null>;
    return { data: null, error: { message: "A recuperação por e-mail exige o serviço de e-mail da produção e não está disponível no SQLite local." } };
  },
  async resetPassword(input: { newPassword: string; token: string }): Promise<Result<null>> {
    if (!useLocalSQLite) return await betterAuthClient.resetPassword(input) as unknown as Result<null>;
    return { data: null, error: { message: "A redefinição de senha por link não está disponível no SQLite local. Use a senha atual para entrar ou redefina pela versão publicada." } };
  },
  async deleteUser(input: { password: string }): Promise<Result<null>> {
    if (!useLocalSQLite) return await betterAuthClient.deleteUser(input) as unknown as Result<null>;
    try { await sqliteRequest<null>("/api/me", { method: "DELETE", body: JSON.stringify(input) }); window.localStorage.removeItem(sessionKey); return { data: null, error: null }; }
    catch (error) { return errorResult(error); }
  },
  async signOut(): Promise<void> {
    if (useLocalSQLite) { window.localStorage.removeItem(sessionKey); return; }
    await betterAuthClient.signOut();
  },
};
