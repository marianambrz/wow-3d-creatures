import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { Activity, AlertTriangle, Bot, ClipboardList, Eye, EyeOff, History, LayoutDashboard, LogOut, Send, Settings, Sparkles, X } from "lucide-react";
import { BEHAVIORS, evaluate, MOODS, SPECIES, type MoodKey, type Species } from "@/lib/mood";
import { authenticateDemo, endDemoSession, getDemoSession, resetDemoPassword } from "@/lib/demo-auth";

const PetScene = lazy(() => import("@/components/PetScene"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Animal Controller — Painel de humor animal" },
      { name: "description", content: "Explore uma demonstração de comportamentos de diferentes animais com visualização 3D." },
      { property: "og:title", content: "Animal Controller — Painel de humor" },
      { property: "og:description", content: "Explore uma demonstração de comportamentos de diferentes animais com visualização 3D." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PRESETS: Record<MoodKey, string[]> = {
  happy: ["relaxed", "playful", "seeks-contact"],
  neutral: ["curious", "eating"],
  stress: ["crouched", "withdrawn", "eating"],
  alert: ["trembling", "low-appetite", "lethargy"],
};

const HISTORY = [
  { when: "Hoje, 08:10", mood: "happy" as MoodKey, note: "Passeio matinal" },
  { when: "Ontem, 19:40", mood: "neutral" as MoodKey, note: "Pós-jantar" },
  { when: "Ontem, 14:05", mood: "stress" as MoodKey, note: "Visita ao veterinário" },
  { when: "Qui, 21:30", mood: "alert" as MoodKey, note: "Fogos de artifício" },
  { when: "Qui, 09:00", mood: "happy" as MoodKey, note: "Brincadeira no quintal" },
];

function Gauge({ score, mood }: { score: number; mood: MoodKey }) {
  const v = Math.max(-8, Math.min(8, score));
  const angle = ((v + 8) / 16) * 180 - 90;
  return (
    <svg viewBox="0 0 200 115" className="w-full" aria-hidden>
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="var(--mood-alert)" />
          <stop offset="0.4" stopColor="var(--mood-stress)" />
          <stop offset="0.65" stopColor="var(--mood-neutral)" />
          <stop offset="1" stopColor="var(--mood-happy)" />
        </linearGradient>
      </defs>
      <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#g)" strokeWidth="14" strokeLinecap="round" />
      <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: "100px 100px", transition: "transform .8s cubic-bezier(.3,1.6,.5,1)" }}>
        <line x1="100" y1="100" x2="100" y2="34" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" />
      </g>
      <circle cx="100" cy="100" r="7" fill={`var(--${MOODS[mood].token})`} />
    </svg>
  );
}

function LoginScreen({ onLogin }: { onLogin: (mode: "login" | "register", email: string, password: string) => Promise<string | null> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register" | "recovery">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (mode === "recovery") {
      setBusy(true);
      try {
        const result = await resetDemoPassword(email, password);
        if (result.error) setError(result.error);
        else { setMode("login"); setPassword(""); setNotice("Senha atualizada neste navegador. Entre com a nova senha."); }
      } finally { setBusy(false); }
      return;
    }
    setBusy(true);
    try {
      const message = await onLogin(mode, email, password);
      if (message) setError(message);
    } finally {
      setBusy(false);
    }
  };
  const heading = mode === "register" ? "Criar conta" : mode === "recovery" ? "Recuperar senha" : "Boas-vindas";

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10 text-foreground">
      <div className="pointer-events-none absolute -left-32 top-12 h-80 w-80 rounded-full bg-mood-happy/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-mood-neutral/10 blur-[110px]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-border bg-card/80 shadow-2xl backdrop-blur-xl md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-10 md:flex">
          <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><Activity className="h-5 w-5" /></span><span className="font-display text-lg font-semibold">Animal Controller</span></div>
          <div><p className="mb-3 text-xs uppercase tracking-[0.28em] text-primary">Bem-estar em foco</p><h1 className="font-display text-4xl font-semibold leading-tight">Um olhar mais atento para quem não fala.</h1><p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">Acompanhe sinais, explore comportamentos e veja uma interpretação visual em 3D.</p></div>
          <p className="text-xs text-slate-400">Cães · gatos · aves · pequenos animais · cavalos</p>
        </div>
        <div className="p-6 sm:p-10">
          <div className="mb-8 md:hidden"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><Activity className="h-5 w-5" /></span><p className="mt-3 font-display font-semibold">Animal Controller</p></div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Acesso à demonstração</p>
          <h2 className="mt-2 font-display text-3xl font-semibold">{heading}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{mode === "register" ? "Crie seu acesso para acompanhar o bem-estar animal." : mode === "recovery" ? "Informe o e-mail cadastrado e escolha uma nova senha." : "Entre para abrir seu painel de acompanhamento."}</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <label className="block text-sm font-medium">E-mail<input required type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setNotice(""); }} placeholder="voce@exemplo.com" className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-ring" /></label>
            <label className="block text-sm font-medium">{mode === "recovery" ? "Nova senha" : "Senha"}<div className="relative mt-2"><input required minLength={6} type={showPassword ? "text" : "password"} autoComplete={mode === "register" || mode === "recovery" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo de 6 caracteres" className="w-full rounded-xl border border-border bg-background px-4 py-3 pr-12 outline-none transition focus:ring-2 focus:ring-ring" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></label>
            {mode === "login" && <button type="button" onClick={() => { setMode("recovery"); setNotice(""); setError(""); }} className="block text-sm text-primary hover:underline">Esqueci minha senha</button>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60">{busy ? "Aguarde…" : mode === "register" ? "Criar conta" : mode === "recovery" ? "Atualizar senha" : "Entrar"}</button>
          </form>
          {notice && <p role="status" className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-sm text-primary">{notice}</p>}
          {error && <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
          {mode === "recovery" ? <button type="button" onClick={() => { setMode("login"); setNotice(""); }} className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground">Voltar para entrar</button> : <button type="button" onClick={() => { setMode(mode === "register" ? "login" : "register"); setNotice(""); setError(""); }} className="mt-5 w-full text-sm text-muted-foreground hover:text-foreground">{mode === "register" ? "Já tem uma conta? Entrar" : "Ainda não tem uma conta? Criar conta"}</button>}
          <p className="mt-5 rounded-xl border border-border bg-background/70 p-3 text-xs leading-relaxed text-muted-foreground">Acesso de demonstração: contas e sessão ficam neste navegador e não são enviadas a um servidor. Na recuperação, a senha é atualizada localmente após informar o e-mail cadastrado.</p>
        </div>
      </div>
    </main>
  );
}

type ChatMessage = { role: "assistant" | "user"; text: string };

function AssistantPanel({ speciesName, mood, alerts, onClose }: { speciesName: string; mood: string; alerts: string[]; onClose: () => void }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: `Olá! Sou o assistente demonstrativo. Posso ajudar a organizar observações sobre ${speciesName.toLocaleLowerCase("pt-BR")}. O que você notou?` },
  ]);
  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = draft.trim();
    if (!question) return;
    const reply = alerts.length
      ? `Pelos sinais marcados, o painel mostra “${mood.toLocaleLowerCase("pt-BR")}” e destaca: ${alerts[0]} Para interpretar isso, considere quando começou, se está se repetindo e o que mudou na rotina. Esta resposta é apenas demonstrativa.`
      : `Anote quando esse comportamento aparece, quanto tempo dura e o que acontece antes ou depois. Com essas observações, fica mais fácil conversar com um profissional que conheça este animal. Esta resposta é apenas demonstrativa.`;
    setMessages((current) => [...current, { role: "user", text: question }, { role: "assistant", text: reply }]);
    setDraft("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="assistant-title" className="flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl">
        <header className="flex items-center justify-between border-b border-border p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground"><Bot className="h-5 w-5" /></span><div><h2 id="assistant-title" className="font-display font-semibold">Assistente animal</h2><p className="flex items-center gap-1 text-xs text-primary"><Sparkles className="h-3 w-3" />Modo demonstração</p></div></div><button onClick={onClose} aria-label="Fechar assistente" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button></header>
        <div className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">{messages.map((message, index) => <div key={index} className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "border border-border bg-card text-card-foreground"}`}>{message.text}</div>)}</div>
        <form onSubmit={sendMessage} className="border-t border-border p-4"><label htmlFor="assistant-message" className="sr-only">Escreva uma mensagem</label><div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2"><input id="assistant-message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Pergunte sobre os sinais observados…" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm outline-none" /><button type="submit" aria-label="Enviar mensagem" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground"><Send className="h-4 w-4" /></button></div><p className="mt-2 text-center text-[11px] text-muted-foreground">Respostas de exemplo, sem conexão com um modelo de IA.</p></form>
      </section>
    </div>
  );
}

function Index() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [species, setSpecies] = useState<Species>("dog");
  const [selected, setSelected] = useState<string[]>(PRESETS.happy);
  const [applied, setApplied] = useState<string[]>(PRESETS.happy);
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(true);
  useEffect(() => {
    const session = getDemoSession();
    if (session) { setUserEmail(session); setLoggedIn(true); }
    setAuthReady(true);
    setMounted(true);
    try { setWebgl(!!document.createElement("canvas").getContext("webgl2")); } catch { setWebgl(false); }
  }, []);
  const { score, mood, alerts } = useMemo(() => evaluate(applied, species), [applied, species]);
  const hasUnappliedChanges = selected.length !== applied.length || selected.some((id) => !applied.includes(id));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const m = MOODS[mood];
  const behaviorGroups = BEHAVIORS[species];
  const speciesInfo = SPECIES.find((item) => item.id === species)!;

  if (!authReady) return <main className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">Carregando acesso…</main>;
  if (!loggedIn) return <LoginScreen onLogin={async (mode, email, password) => {
    const result = await authenticateDemo(mode, email, password);
    if (result.email) { setUserEmail(result.email); setLoggedIn(true); return null; }
    return result.error ?? "Não foi possível validar o acesso.";
  }} />;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <aside className="hidden h-screen w-20 shrink-0 flex-col items-center gap-6 border-r border-border py-6 md:flex" aria-label="Navegação principal">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Activity className="h-5 w-5" /></div>
        {[
          { Icon: LayoutDashboard, label: "Painel", target: "dashboard" },
          { Icon: ClipboardList, label: "Comportamentos", target: "behaviors" },
          { Icon: History, label: "Histórico", target: "history" },
        ].map(({ Icon, label, target }) => (
          <button key={target} type="button" aria-label={label} title={label} onClick={() => {
            const panel = document.getElementById("dashboard");
            if (target === "dashboard") panel?.scrollTo({ top: 0, behavior: "smooth" });
            else document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
          }} className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-foreground"><Icon className="h-5 w-5" /></button>
        ))}
        <button type="button" aria-label="Configurações" title="Configurações" onClick={() => setSettingsOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-foreground"><Settings className="h-5 w-5" /></button>
      </aside>

      <main id="dashboard" className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Animal Controller</p>
            <h1 className="font-display text-2xl font-semibold md:text-3xl">Avaliação comportamental</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <span className="hidden text-sm text-muted-foreground lg:inline">{userEmail}</span>
          <button onClick={() => setAssistantOpen(true)} className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary/20"><Sparkles className="h-4 w-4" />Perguntar à IA</button>
          <div className="glass flex max-w-full flex-wrap rounded-xl p-1">
            {SPECIES.map((item) => (
              <button key={item.id} onClick={() => { setSpecies(item.id); setSelected([]); setApplied([]); }} aria-pressed={species === item.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${species === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <span aria-hidden="true">{item.icon}</span>{item.name}
              </button>
            ))}
          </div>
          <button onClick={() => { endDemoSession(); setLoggedIn(false); }} aria-label="Sair da demonstração" title="Sair" className="rounded-xl border border-border p-3 text-muted-foreground transition hover:bg-secondary"><LogOut className="h-4 w-4" /></button>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[320px_1fr_300px]">
          <section id="behaviors" className="glass order-2 scroll-mt-6 rounded-2xl p-5 xl:order-1">
            <h2 className="font-display mb-1 font-semibold">Comportamentos observados</h2>
            <p className="mb-4 text-xs text-muted-foreground">Marque o que você notou agora.</p>
            <button type="button" onClick={() => setApplied(selected)} disabled={!hasUnappliedChanges} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-default disabled:opacity-60">
              <Sparkles className="h-4 w-4" />{hasUnappliedChanges ? "Aplicar e ver resultado" : "Resultado aplicado"}
            </button>
            <div className="mb-4 flex gap-2">
              {(Object.keys(PRESETS) as MoodKey[]).map((k) => (
                <button key={k} aria-label={`Exemplo de comportamento: ${MOODS[k].label}`} title={`Exemplo: ${MOODS[k].label}`} onClick={() => setSelected(PRESETS[k].filter((id) => behaviorGroups.some((g) => g.items.some((item) => item.id === id))))} className="h-6 flex-1 rounded-full border border-border transition hover:scale-105" style={{ background: `var(--${MOODS[k].token})` }} />
              ))}
            </div>
            <p className="mb-4 text-xs text-muted-foreground">Exemplos para {speciesInfo.name.toLocaleLowerCase("pt-BR")} — ajuste conforme o contexto do animal.</p>
            {behaviorGroups.map((g) => (
              <div key={g.title} className="mb-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</p>
                <div className="flex flex-wrap gap-2">
                  {g.items.map((it) => {
                    const on = selected.includes(it.id);
                    return (
                      <button key={it.id} onClick={() => toggle(it.id)} aria-pressed={on} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? (it.w > 0 ? "border-mood-happy bg-mood-happy/15 text-mood-happy" : "border-mood-alert bg-mood-alert/15 text-mood-alert") : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}>
                        {it.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>

          <section className="glass relative order-1 h-[440px] overflow-hidden rounded-2xl md:h-[600px] xl:order-2">
            {mounted && webgl ? (
              <Suspense fallback={<div className="grid h-full place-items-center text-muted-foreground">Carregando cena 3D…</div>}>
                <PetScene species={species} mood={mood} />
              </Suspense>
            ) : (
              <div className="grid h-full place-items-center text-muted-foreground">{mounted ? "Seu navegador não suporta 3D." : ""}</div>
            )}
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold glass">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full" style={{ background: `var(--${m.token})` }} />
              Ao vivo
            </div>
            <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] text-muted-foreground">Arraste para girar</p>
          </section>

          <section className="order-3 flex flex-col gap-5">
            <div id="history" className="glass scroll-mt-6 rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Leitura demonstrativa de comportamento</p>
              <Gauge score={score} mood={mood} />
              {hasUnappliedChanges && <p role="status" className="-mt-2 mb-2 text-center text-xs font-medium text-primary">Aplique as alterações para atualizar o resultado.</p>}
              <p className="font-display -mt-2 text-center text-2xl font-semibold" style={{ color: `var(--${m.token})` }}>{m.label}</p>
              <p className="text-center text-xs text-muted-foreground">Pontuação {score > 0 ? `+${score}` : score}</p>
              <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">Esta estimativa simplificada não substitui avaliação veterinária.</p>
              {alerts.length > 0 && (
                <div className="mt-4 space-y-2">
                  {alerts.map((a) => (
                    <div key={a} className="flex gap-2 rounded-lg border border-mood-alert/40 bg-mood-alert/10 p-2.5 text-xs text-mood-alert">
                      <AlertTriangle className="h-4 w-4 shrink-0" />{a}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="glass rounded-2xl p-5">
              <h3 className="font-display mb-3 font-semibold">Histórico recente</h3>
              <ul className="space-y-3">
                {HISTORY.map((h) => (
                  <li key={h.when} className="flex items-center gap-3 text-sm">
                    <span className="h-8 w-1.5 rounded-full" style={{ background: `var(--${MOODS[h.mood].token})` }} />
                    <div className="flex-1"><p className="font-medium">{h.note}</p><p className="text-xs text-muted-foreground">{h.when}</p></div>
                    <span className="text-xs text-muted-foreground">{MOODS[h.mood].label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>
      {settingsOpen && <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="settings-title" className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
          <header className="mb-5 flex items-center justify-between"><div><h2 id="settings-title" className="font-display text-xl font-semibold">Configurações</h2><p className="mt-1 text-sm text-muted-foreground">Conta desta demonstração</p></div><button type="button" onClick={() => setSettingsOpen(false)} aria-label="Fechar configurações" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"><X className="h-5 w-5" /></button></header>
          <p className="rounded-xl border border-border bg-card p-4 text-sm"><span className="block text-xs text-muted-foreground">E-mail conectado</span><span className="mt-1 block font-medium">{userEmail}</span></p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Os dados de acesso da demonstração são armazenados somente neste navegador.</p>
          <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setSettingsOpen(false)} className="rounded-xl border border-border px-4 py-2 text-sm hover:bg-secondary">Fechar</button><button type="button" onClick={() => { setSettingsOpen(false); endDemoSession(); setLoggedIn(false); }} className="flex items-center gap-2 rounded-xl bg-destructive px-4 py-2 text-sm font-semibold text-background"><LogOut className="h-4 w-4" />Sair</button></div>
        </section>
      </div>}
      {assistantOpen && <AssistantPanel speciesName={speciesInfo.name} mood={m.label} alerts={alerts} onClose={() => setAssistantOpen(false)} />}
    </div>
  );
}
