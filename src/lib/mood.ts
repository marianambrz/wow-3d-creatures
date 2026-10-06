export type Species = "dog" | "cat" | "bird" | "rabbit" | "guinea-pig" | "horse" | "hamster";
export type MoodKey = "happy" | "neutral" | "stress" | "alert";

export const SPECIES: { id: Species; name: string; petName: string; icon: string }[] = [
  { id: "dog", name: "Cão", petName: "Thor", icon: "🐕" },
  { id: "cat", name: "Gato", petName: "Mia", icon: "🐈" },
  { id: "bird", name: "Ave", petName: "Lilo", icon: "🦜" },
  { id: "rabbit", name: "Coelho", petName: "Pipoca", icon: "🐇" },
  { id: "guinea-pig", name: "Porquinho-da-índia", petName: "Pingo", icon: "🐹" },
  { id: "horse", name: "Cavalo", petName: "Trovão", icon: "🐎" },
  { id: "hamster", name: "Hamster", petName: "Bolinha", icon: "🐹" },
];

export type Behavior = { id: string; label: string; w: number; alert?: string };
export type BehaviorGroup = { title: string; items: Behavior[] };

const groups = (body: Behavior[], social: Behavior[], routine: Behavior[]): BehaviorGroup[] => [
  { title: "Corpo e postura", items: body },
  { title: "Interação e sinais", items: social },
  { title: "Rotina", items: routine },
];

const commonRoutine: Behavior[] = [
  { id: "eating", label: "Comeu normalmente", w: 1 },
  { id: "resting", label: "Descansou bem", w: 1 },
  { id: "low-appetite", label: "Comeu menos ou recusou alimento", w: -2, alert: "Redução do apetite observada: acompanhe a ingestão e procure orientação veterinária se persistir." },
  { id: "lethargy", label: "Pouca energia", w: -2, alert: "Baixa energia observada: considere o contexto e acompanhe a evolução." },
  { id: "drinking", label: "Bebeu água normalmente", w: 1 },
  { id: "low-drinking", label: "Bebeu menos água que o habitual", w: -2, alert: "Mudança no consumo de água: acompanhe a hidratação e procure orientação veterinária se persistir." },
  { id: "grooming", label: "Higiene ou limpeza habitual", w: 1 },
  { id: "itching", label: "Coceira ou limpeza excessiva", w: -1, alert: "Coceira ou limpeza excessiva pode indicar desconforto; observe a frequência e procure orientação se persistir." },
  { id: "vomiting", label: "Vômito ou regurgitação", w: -4, alert: "Vômitos ou regurgitação observados: acompanhe e entre em contato com um veterinário, especialmente se se repetirem." },
  { id: "diarrhea", label: "Fezes amolecidas ou diarreia", w: -3, alert: "Alteração nas fezes observada: acompanhe a evolução e procure orientação veterinária." },
  { id: "mobility-change", label: "Dificuldade ou mudança ao se movimentar", w: -3, alert: "Mudança na mobilidade pode indicar dor ou desconforto; evite forçar movimentos e procure orientação veterinária." },
  { id: "breathing-change", label: "Respiração difícil ou diferente do habitual", w: -5, alert: "Dificuldade respiratória pode ser urgente. Procure atendimento veterinário imediatamente." },
];

export const BEHAVIORS: Record<Species, BehaviorGroup[]> = {
  dog: groups([
    { id: "relaxed", label: "Corpo relaxado", w: 2 }, { id: "tail-wag", label: "Cauda solta / abanando", w: 2 },
    { id: "playful", label: "Convida para brincar", w: 2 }, { id: "crouched", label: "Encolhido", w: -2 },
    { id: "trembling", label: "Tremores", w: -3, alert: "Tremores observados: podem ter várias causas; procure orientação veterinária se persistirem." },
  ], [
    { id: "seeks-contact", label: "Busca contato", w: 1 }, { id: "curious", label: "Explora com curiosidade", w: 1 },
    { id: "withdrawn", label: "Evita interação", w: -2 }, { id: "growling", label: "Rosna ou ameaça", w: -3, alert: "Sinal de desconforto ou defesa: dê espaço e evite forçar contato." },
  ], commonRoutine),
  cat: groups([
    { id: "relaxed", label: "Postura solta", w: 2 }, { id: "tail-wag", label: "Cauda erguida e tranquila", w: 2 },
    { id: "playful", label: "Brinca / caça brinquedos", w: 2 }, { id: "crouched", label: "Corpo encolhido", w: -2 },
    { id: "trembling", label: "Tremores", w: -3, alert: "Tremores observados: podem ter várias causas; procure orientação veterinária se persistirem." },
  ], [
    { id: "seeks-contact", label: "Busca carinho", w: 1 }, { id: "curious", label: "Explora o ambiente", w: 1 },
    { id: "withdrawn", label: "Se esconde / se isola", w: -2 }, { id: "growling", label: "Rosna ou sibila", w: -3, alert: "Sinal de desconforto ou defesa: dê espaço e evite forçar contato." },
  ], commonRoutine),
  bird: groups([
    { id: "relaxed", label: "Penas assentadas e postura estável", w: 2 }, { id: "playful", label: "Ativo e brincalhão", w: 2 },
    { id: "crouched", label: "Agachado ou arrepiado", w: -2 }, { id: "trembling", label: "Tremores ou perda de equilíbrio", w: -3, alert: "Tremores ou desequilíbrio em aves merecem atenção veterinária rápida." },
  ], [
    { id: "curious", label: "Vocaliza e explora", w: 1 }, { id: "seeks-contact", label: "Interage espontaneamente", w: 1 },
    { id: "withdrawn", label: "Quieto / isolado", w: -2 }, { id: "growling", label: "Bica ou demonstra defesa", w: -2 },
  ], commonRoutine),
  rabbit: groups([
    { id: "relaxed", label: "Deitado de forma relaxada", w: 2 }, { id: "playful", label: "Salta e explora", w: 2 },
    { id: "crouched", label: "Encolhido e imóvel", w: -2 }, { id: "trembling", label: "Tremores", w: -3, alert: "Tremores observados: reduza estímulos e procure orientação veterinária." },
  ], [
    { id: "curious", label: "Fareja o ambiente", w: 1 }, { id: "seeks-contact", label: "Aceita aproximação", w: 1 },
    { id: "withdrawn", label: "Se esconde", w: -2 }, { id: "growling", label: "Bate as patas / investe", w: -2 },
  ], [...commonRoutine, { id: "droppings", label: "Fezes em quantidade habitual", w: 1 }, { id: "few-droppings", label: "Poucas ou nenhuma fezes", w: -4, alert: "Redução ou ausência de fezes em coelhos requer contato veterinário imediato." }]),
  "guinea-pig": groups([
    { id: "relaxed", label: "Corpo relaxado", w: 2 }, { id: "playful", label: "Corre / explora", w: 2 },
    { id: "crouched", label: "Fica encolhido", w: -2 }, { id: "trembling", label: "Tremores", w: -3, alert: "Tremores observados: acompanhe de perto e procure orientação veterinária." },
  ], [
    { id: "curious", label: "Vocaliza ao perceber pessoas", w: 1 }, { id: "seeks-contact", label: "Aceita interação", w: 1 },
    { id: "withdrawn", label: "Se esconde / fica imóvel", w: -2 }, { id: "growling", label: "Bate os dentes", w: -2 },
  ], [...commonRoutine, { id: "few-droppings", label: "Redução das fezes", w: -3, alert: "Mudança nas fezes de pequenos herbívoros merece avaliação veterinária." }]),
  horse: groups([
    { id: "relaxed", label: "Postura solta e apoio equilibrado", w: 2 }, { id: "playful", label: "Atento e disposto a se mover", w: 1 },
    { id: "crouched", label: "Postura tensa ou abatida", w: -2 }, { id: "trembling", label: "Tremores / suor sem esforço", w: -3, alert: "Tremores ou suor sem esforço em cavalos justificam avaliação veterinária." },
  ], [
    { id: "curious", label: "Orelhas atentas ao ambiente", w: 1 }, { id: "seeks-contact", label: "Interage com tranquilidade", w: 1 },
    { id: "withdrawn", label: "Apático ou isolado", w: -2 }, { id: "growling", label: "Ameaça com coices ou mordidas", w: -3, alert: "Mantenha distância segura e não force aproximação." },
  ], [...commonRoutine, { id: "few-droppings", label: "Alteração nas fezes", w: -3, alert: "Alterações digestivas em cavalos podem ser urgentes; contate um veterinário." }]),
  hamster: groups([
    { id: "relaxed", label: "Postura relaxada", w: 2 }, { id: "playful", label: "Explora / usa a roda", w: 2 },
    { id: "crouched", label: "Encolhido ou imóvel", w: -2 }, { id: "trembling", label: "Tremores", w: -3, alert: "Tremores observados: mantenha o ambiente calmo e procure orientação veterinária." },
  ], [
    { id: "curious", label: "Fareja e explora", w: 1 }, { id: "seeks-contact", label: "Interage sem sinais de defesa", w: 1 },
    { id: "withdrawn", label: "Se esconde fora do padrão", w: -2 }, { id: "growling", label: "Morde ou vocaliza em defesa", w: -2 },
  ], commonRoutine),
};

export const MOODS: Record<MoodKey, { label: string; token: string; color: string }> = {
  happy: { label: "Bem disposto", token: "mood-happy", color: "#3fd69a" },
  neutral: { label: "Estável", token: "mood-neutral", color: "#7fb4d6" },
  stress: { label: "Possível desconforto", token: "mood-stress", color: "#f2c14e" },
  alert: { label: "Sinais de atenção", token: "mood-alert", color: "#f0604a" },
};

export function evaluate(selected: string[], species: Species) {
  const all = BEHAVIORS[species].flatMap((group) => group.items);
  const unique = [...new Set(selected)];
  const score = unique.reduce((sum, id) => sum + (all.find((item) => item.id === id)?.w ?? 0), 0);
  const mood: MoodKey = score >= 3 ? "happy" : score >= 0 ? "neutral" : score >= -3 ? "stress" : "alert";
  const alerts = unique.flatMap((id) => {
    const alert = all.find((item) => item.id === id)?.alert;
    return alert ? [alert] : [];
  });
  return { score, mood, alerts };
}
