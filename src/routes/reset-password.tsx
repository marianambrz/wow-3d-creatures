import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage });

function ResetPasswordPage() {
  const token = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const result = await authClient.resetPassword({ newPassword: password, token });
    setBusy(false);
    if (result.error) setError(result.error.message ?? "O link expirou ou não é válido.");
    else setMessage("Senha atualizada. Você já pode entrar com a nova senha.");
  };
  return <main className="grid min-h-screen place-items-center bg-background px-4 text-foreground"><section className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Animal Controller</p><h1 className="mt-3 font-display text-3xl font-semibold">Redefinir senha</h1>{token ? <form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-medium">Nova senha<input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" /></label><button disabled={busy} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">{busy ? "Aguarde…" : "Atualizar senha"}</button></form> : <p className="mt-4 text-sm text-muted-foreground">Link ausente ou inválido. Solicite uma nova redefinição de senha.</p>}{message && <p role="status" className="mt-4 text-sm text-primary">{message}</p>}{error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}<Link to="/" className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">Voltar para entrar</Link></section></main>;
}
