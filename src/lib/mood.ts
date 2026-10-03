export type Species = "dog" | "cat";
export type MoodKey = "happy" | "neutral" | "stress" | "alert";

export const BEHAVIOR_GROUPS: { title: string; items: { id: string; label: string; w: number }[] }[] = [
  {
    title: "Corpo e postura",
    items: [
      { id: "relaxado", label: "Corpo relaxado", w: 2 },
      { id: "cauda", label: "Cauda abanando", w: 2 },
      { id: "brincando", label: "Brincando", w: 2 },
      { id: "encolhido", label: "Encolhido", w: -2 },
      { id: "tremor", label: "Tremor", w: -3 },
      { id: "prostracao", label: "Prostração", w: -3 },
    ],
  },
  {
    title: "Interação",
    items: [
      { id: "carinho", label: "Busca carinho", w: 2 },
      { id: "curioso", label: "Curioso", w: 1 },
      { id: "isolado", label: "Se isola", w: -2 },
      { id: "rosnando", label: "Rosnando / sibilando", w: -3 },
      { id: "morder", label: "Tentou morder", w: -4 },
    ],
  },
  {
    title: "Rotina",
    items: [
      { id: "comeu", label: "Comeu bem", w: 1 },
      { id: "dormiu", label: "Dormiu bem", w: 1 },
      { id: "semapetite", label: "Sem apetite", w: -2 },
      { id: "vocaliza", label: "Vocalização excessiva", w: -1 },
    ],
  },
];

export const ALERTS: Record<string, string> = {
  tremor: "Tremor observado — avaliar dor ou medo.",
  prostracao: "Prostração — recomendada avaliação clínica.",
  semapetite: "Sem apetite — monitorar ingestão nas próximas horas.",
  morder: "Tentativa de mordida — manejo com cautela.",
};

export const MOODS: Record<MoodKey, { label: string; token: string; color: string }> = {
  happy: { label: "Feliz", token: "mood-happy", color: "#3fd69a" },
  neutral: { label: "Neutro", token: "mood-neutral", color: "#7fb4d6" },
  stress: { label: "Estressado", token: "mood-stress", color: "#f2c14e" },
  alert: { label: "Muito alterado", token: "mood-alert", color: "#f0604a" },
};

export function evaluate(selected: string[]) {
  const all = BEHAVIOR_GROUPS.flatMap((g) => g.items);
  const score = selected.reduce((s, id) => s + (all.find((i) => i.id === id)?.w ?? 0), 0);
  const mood: MoodKey = score >= 3 ? "happy" : score >= 0 ? "neutral" : score >= -3 ? "stress" : "alert";
  const alerts = selected.filter((id) => ALERTS[id]).map((id) => ALERTS[id]);
  return { score, mood, alerts };
}
