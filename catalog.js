// Catálogo de espécies, comportamentos e regra de pontuação.
// Ajuste pesos (w) e rótulos aqui — o front lê tudo via GET /api/catalog.
export const SPECIES = {
  cao: 'Cão', gato: 'Gato', ave: 'Ave', coelho: 'Coelho',
  porquinho_da_india: 'Porquinho-da-índia', cavalo: 'Cavalo', hamster: 'Hamster',
};
export const GROUPS = { corpo: 'Corpo e postura', interacao: 'Interação e sinais', saude: 'Saúde e rotina' };

// w: pontos (+ bom / − preocupante) · flag: nível mínimo forçado · sp: só estas espécies · labels: rótulo por espécie
export const BEHAVIORS = [
  { key: 'postura_solta', group: 'corpo', w: 2, label: 'Postura solta' },
  { key: 'cauda_erguida', group: 'corpo', w: 2, sp: ['gato'], label: 'Cauda erguida e tranquila' },
  { key: 'rabo_abanando', group: 'corpo', w: 2, sp: ['cao'], label: 'Rabo abanando de forma relaxada' },
  { key: 'orelhas_relaxadas', group: 'corpo', w: 2, sp: ['cavalo', 'coelho'], label: 'Orelhas relaxadas' },
  { key: 'canta_assobia', group: 'corpo', w: 2, sp: ['ave'], label: 'Canta ou assobia' },
  { key: 'penas_eriçadas', group: 'corpo', w: -2, sp: ['ave'], label: 'Penas eriçadas e quieta' },
  { key: 'corpo_encolhido', group: 'corpo', w: -2, label: 'Corpo encolhido' },
  { key: 'tremores', group: 'corpo', w: -3, flag: 'atencao', label: 'Tremores' },

  { key: 'brinca', group: 'interacao', w: 2, label: 'Brinca ou se movimenta com disposição', labels: { gato: 'Brinca / caça brinquedos', cao: 'Brinca / busca a bolinha' } },
  { key: 'busca_carinho', group: 'interacao', w: 1, label: 'Busca carinho' },
  { key: 'explora', group: 'interacao', w: 1, label: 'Explora o ambiente' },
  { key: 'saltinhos', group: 'interacao', w: 2, sp: ['coelho', 'porquinho_da_india'], label: 'Dá saltinhos de alegria' },
  { key: 'usa_roda', group: 'interacao', w: 2, sp: ['hamster'], label: 'Usa a roda com disposição' },
  { key: 'isolamento', group: 'interacao', w: -2, label: 'Isolado ou se escondendo mais que o normal' },
  { key: 'agressividade', group: 'interacao', w: -2, label: 'Irritado ou agressivo fora do normal' },

  { key: 'higiene_habitual', group: 'saude', w: 1, label: 'Higiene ou limpeza habitual' },
  { key: 'bebeu_menos_agua', group: 'saude', w: -2, label: 'Bebeu menos água que o habitual' },
  { key: 'coceira_excessiva', group: 'saude', w: -2, label: 'Coceira ou limpeza excessiva' },
  { key: 'vomito', group: 'saude', w: -3, flag: 'atencao', label: 'Vômito ou regurgitação' },
  { key: 'fezes_amolecidas', group: 'saude', w: -3, flag: 'atencao', label: 'Fezes amolecidas ou diarreia' },
  { key: 'dificuldade_mover', group: 'saude', w: -3, flag: 'atencao', label: 'Dificuldade ou mudança ao se movimentar' },
  { key: 'respiracao_dificil', group: 'saude', w: -4, flag: 'alerta', label: 'Respiração difícil ou diferente do habitual' },
];

// Níveis (os 4 tons do medidor). min = pontuação mínima.
export const LEVELS = [
  { key: 'bem_disposto', label: 'Bem disposto', color: '#3ddc84', min: 3, tip: 'Sinais positivos. Mantenha a rotina e o diário em dia.' },
  { key: 'tranquilo', label: 'Tranquilo', color: '#7cb7e0', min: 0, tip: 'Sem sinais fortes. Continue observando.' },
  { key: 'atencao', label: 'Atenção', color: '#ffc233', min: -4, tip: 'Alguns sinais merecem acompanhamento nas próximas horas.' },
  { key: 'alerta', label: 'Alerta', color: '#ff5a4d', min: -Infinity, tip: 'Sinais importantes. Considere contatar um veterinário.' },
];
export const DISCLAIMER = 'Estimativa simplificada de comportamento; não substitui avaliação veterinária.';
const order = LEVELS.map(l => l.key); // do melhor para o pior

export const behaviorsFor = sp => BEHAVIORS.filter(b => !b.sp || b.sp.includes(sp)).map(b => ({
  key: b.key, group: b.group, weight: b.w, label: b.labels?.[sp] || b.label,
}));

export function evaluate(species, keys) {
  const valid = new Map(behaviorsFor(species).map(b => [b.key, b]));
  const unknown = keys.filter(k => !valid.has(k));
  const picked = [...new Set(keys)].filter(k => valid.has(k));
  const score = picked.reduce((a, k) => a + valid.get(k).weight, 0);
  let lvl = LEVELS.find(l => score >= l.min);
  const flags = BEHAVIORS.filter(b => picked.includes(b.key) && b.flag);
  for (const f of flags) if (order.indexOf(f.flag) > order.indexOf(lvl.key)) lvl = LEVELS.find(l => l.key === f.flag);
  const cap = { alerta: 20, atencao: 45 }[lvl.key] ?? 100; // o ponteiro nunca contradiz o nível
  const gauge = Math.min(cap, Math.round(Math.max(0, Math.min(1, (score + 10) / 20)) * 100)); // 0 = vermelho, 100 = verde
  return {
    score, level: lvl.key, label: lvl.label, color: lvl.color, tip: lvl.tip, gauge,
    forced: flags.some(f => f.flag === lvl.key) ? flags.filter(f => f.flag === lvl.key).map(f => f.key) : [],
    behaviors: picked, unknown, disclaimer: DISCLAIMER,
  };
}
