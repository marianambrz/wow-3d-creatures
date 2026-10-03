import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Cat, ClipboardList, Dog, History, LayoutDashboard, Settings } from "lucide-react";
import { BEHAVIOR_GROUPS, evaluate, MOODS, type MoodKey, type Species } from "@/lib/mood";

const PetScene = lazy(() => import("@/components/PetScene"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Animal Controller — Painel de humor animal" },
      { name: "description", content: "Avalie comportamentos e veja o humor do seu cão ou gato em 3D." },
      { property: "og:title", content: "Animal Controller — Painel de humor" },
      { property: "og:description", content: "Avalie comportamentos e veja o humor do seu cão ou gato em 3D." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const PRESETS: Record<MoodKey, string[]> = {
  happy: ["relaxado", "cauda", "brincando", "carinho"],
  neutral: ["curioso", "comeu"],
  stress: ["encolhido", "isolado", "comeu"],
  alert: ["tremor", "rosnando", "morder", "semapetite"],
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

function Index() {
  const [species, setSpecies] = useState<Species>("dog");
  const [selected, setSelected] = useState<string[]>(PRESETS.happy);
  const [mounted, setMounted] = useState(false);
  const [webgl, setWebgl] = useState(true);
  useEffect(() => {
    setMounted(true);
    try { setWebgl(!!document.createElement("canvas").getContext("webgl2")); } catch { setWebgl(false); }
  }, []);
  const { score, mood, alerts } = useMemo(() => evaluate(selected), [selected]);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const m = MOODS[mood];

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-20 flex-col items-center gap-6 border-r border-border py-6 md:flex">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground"><Activity className="h-5 w-5" /></div>
        {[LayoutDashboard, ClipboardList, History, Settings].map((I, i) => (
          <button key={i} className={`grid h-11 w-11 place-items-center rounded-xl transition ${i === 0 ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"}`}><I className="h-5 w-5" /></button>
        ))}
      </aside>

      <main className="flex-1 overflow-hidden p-4 md:p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Animal Controller</p>
            <h1 className="font-display text-2xl font-semibold md:text-3xl">Avaliação comportamental</h1>
          </div>
          <div className="glass flex rounded-xl p-1">
            {([["dog", "Thor · Cão", Dog], ["cat", "Mia · Gato", Cat]] as const).map(([k, l, I]) => (
              <button key={k} onClick={() => setSpecies(k)} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${species === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <I className="h-4 w-4" />{l}
              </button>
            ))}
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[320px_1fr_300px]">
          <section className="glass order-2 rounded-2xl p-5 xl:order-1">
            <h2 className="font-display mb-1 font-semibold">Comportamentos observados</h2>
            <p className="mb-4 text-xs text-muted-foreground">Marque o que você notou agora.</p>
            <div className="mb-4 flex gap-2">
              {(Object.keys(PRESETS) as MoodKey[]).map((k) => (
                <button key={k} title={`Exemplo: ${MOODS[k].label}`} onClick={() => setSelected(PRESETS[k])} className="h-6 flex-1 rounded-full border border-border transition hover:scale-105" style={{ background: `var(--${MOODS[k].token})` }} />
              ))}
            </div>
            {BEHAVIOR_GROUPS.map((g) => (
              <div key={g.title} className="mb-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</p>
                <div className="flex flex-wrap gap-2">
                  {g.items.map((it) => {
                    const on = selected.includes(it.id);
                    return (
                      <button key={it.id} onClick={() => toggle(it.id)} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${on ? (it.w > 0 ? "border-mood-happy bg-mood-happy/15 text-mood-happy" : "border-mood-alert bg-mood-alert/15 text-mood-alert") : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}>
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
            <div className="glass rounded-2xl p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Humor estimado</p>
              <Gauge score={score} mood={mood} />
              <p className="font-display -mt-2 text-center text-2xl font-semibold" style={{ color: `var(--${m.token})` }}>{m.label}</p>
              <p className="text-center text-xs text-muted-foreground">Pontuação {score > 0 ? `+${score}` : score}</p>
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
    </div>
  );
}
