// Animal Controller API — zero dependências (Node >= 22.13)
import http from 'node:http';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { SPECIES, GROUPS, LEVELS, DISCLAIMER, behaviorsFor, evaluate } from './catalog.js';

const PORT = +process.env.PORT || 3000;
const DB_FILE = process.env.DB_FILE || 'animal.db';
const ORIGIN = process.env.CORS_ORIGIN || '*';
const SECRET = process.env.JWT_SECRET || (() => {   // gera e guarda um segredo local se não houver
  try { return fs.readFileSync('.secret', 'utf8'); } catch { const s = crypto.randomBytes(32).toString('hex'); fs.writeFileSync('.secret', s, { mode: 0o600 }); return s; }
})();

// ---------- Banco ----------
const db = new DatabaseSync(DB_FILE);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, hash TEXT NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS animals(id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  species TEXT NOT NULL, name TEXT NOT NULL, tutor_name TEXT, breed TEXT, birth_date TEXT, notes TEXT, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS observations(id INTEGER PRIMARY KEY, animal_id INTEGER NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  ts INTEGER NOT NULL, behaviors TEXT NOT NULL, score INTEGER NOT NULL, level TEXT NOT NULL, note TEXT);
CREATE INDEX IF NOT EXISTS ix_o ON observations(animal_id, ts);
CREATE TABLE IF NOT EXISTS vaccines(id INTEGER PRIMARY KEY, animal_id INTEGER NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  name TEXT NOT NULL, applied_on TEXT NOT NULL, next_dose TEXT);
CREATE TABLE IF NOT EXISTS diary(id INTEGER PRIMARY KEY, animal_id INTEGER NOT NULL REFERENCES animals(id) ON DELETE CASCADE,
  ts INTEGER NOT NULL, text TEXT NOT NULL);`);
const P = s => db.prepare(s);
const q = {
  userByEmail: P('SELECT * FROM users WHERE email=?'), addUser: P('INSERT INTO users(email,hash,created) VALUES(?,?,?)'),
  animals: P('SELECT * FROM animals WHERE user_id=? ORDER BY id'), animal: P('SELECT * FROM animals WHERE id=? AND user_id=?'),
  addAnimal: P('INSERT INTO animals(user_id,species,name,tutor_name,breed,birth_date,notes,created) VALUES(?,?,?,?,?,?,?,?)'),
  updAnimal: P('UPDATE animals SET species=?,name=?,tutor_name=?,breed=?,birth_date=?,notes=? WHERE id=?'),
  delAnimal: P('DELETE FROM animals WHERE id=?'),
  addObs: P('INSERT INTO observations(animal_id,ts,behaviors,score,level,note) VALUES(?,?,?,?,?,?)'),
  lastObs: P('SELECT * FROM observations WHERE animal_id=? ORDER BY ts DESC, id DESC LIMIT 1'),
  obs: P('SELECT * FROM observations WHERE animal_id=? AND ts>=? ORDER BY ts DESC LIMIT ?'),
  vacs: P('SELECT * FROM vaccines WHERE animal_id=? ORDER BY applied_on DESC'), addVac: P('INSERT INTO vaccines(animal_id,name,applied_on,next_dose) VALUES(?,?,?,?)'),
  vac: P('SELECT v.* FROM vaccines v JOIN animals a ON a.id=v.animal_id WHERE v.id=? AND a.user_id=?'), delVac: P('DELETE FROM vaccines WHERE id=?'),
  diary: P('SELECT * FROM diary WHERE animal_id=? ORDER BY ts DESC LIMIT ?'), addDiary: P('INSERT INTO diary(animal_id,ts,text) VALUES(?,?,?)'),
  entry: P('SELECT d.* FROM diary d JOIN animals a ON a.id=d.animal_id WHERE d.id=? AND a.user_id=?'), delDiary: P('DELETE FROM diary WHERE id=?'),
};

// ---------- Auth (scrypt + JWT HS256) ----------
const b64 = b => Buffer.from(b).toString('base64url');
const mac = s => crypto.createHmac('sha256', SECRET).update(s).digest();
const sign = p => { const x = b64('{"alg":"HS256","typ":"JWT"}') + '.' + b64(JSON.stringify(p)); return x + '.' + mac(x).toString('base64url'); };
function verify(t) {
  try {
    const [h, b, s] = t.split('.'), g = Buffer.from(s, 'base64url'), e = mac(h + '.' + b);
    if (g.length !== e.length || !crypto.timingSafeEqual(g, e)) return null;
    const p = JSON.parse(Buffer.from(b, 'base64url')); return p.exp > Date.now() / 1000 ? p : null;
  } catch { return null; }
}
const hashPw = pw => { const s = crypto.randomBytes(16); return s.toString('hex') + ':' + crypto.scryptSync(pw, s, 64).toString('hex'); };
const checkPw = (pw, st) => { const [s, h] = st.split(':'); return crypto.timingSafeEqual(crypto.scryptSync(pw, Buffer.from(s, 'hex'), 64), Buffer.from(h, 'hex')); };
const session = u => ({ token: sign({ sub: u.id, exp: Math.floor(Date.now() / 1000) + 7 * 86400 }), user: { id: u.id, email: u.email } });
const tries = new Map(); // limitador simples de login: 10 tentativas / 15 min por e-mail
function throttled(k) { const n = Date.now(), a = (tries.get(k) || []).filter(t => n - t < 9e5); a.push(n); tries.set(k, a); return a.length > 10; }

// ---------- Helpers ----------
class Err extends Error { constructor(c, m) { super(m); this.code = c; } }
const need = (c, m) => { if (!c) throw new Err(400, m); };
const str = (v, max = 120) => (v == null || v === '' ? null : String(v).trim().slice(0, max));
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));
const animalOr404 = (id, u) => q.animal.get(+id, u.id) || (() => { throw new Err(404, 'animal não encontrado'); })();
const outAnimal = a => ({ id: a.id, species: a.species, speciesLabel: SPECIES[a.species], name: a.name, tutorName: a.tutor_name, breed: a.breed, birthDate: a.birth_date, notes: a.notes });
const outObs = (a, o) => o && { id: o.id, ts: o.ts, note: o.note, ...evaluate(a.species, JSON.parse(o.behaviors)) };
const outVac = v => ({ id: v.id, name: v.name, appliedOn: v.applied_on, nextDose: v.next_dose, due: !!v.next_dose && v.next_dose < new Date().toISOString().slice(0, 10) });

function animalBody(b, cur = {}) {
  const species = b.species ?? cur.species, name = str(b.name ?? cur.name, 60);
  need(SPECIES[species], 'species inválida. Use: ' + Object.keys(SPECIES).join(', '));
  need(name, 'name é obrigatório');
  const birth = str(b.birthDate ?? cur.birth_date, 10); need(!birth || isDate(birth), 'birthDate deve ser AAAA-MM-DD');
  return [species, name, str(b.tutorName ?? cur.tutor_name, 80), str(b.breed ?? cur.breed, 60), birth, str(b.notes ?? cur.notes, 500)];
}

// Assistente: respostas por regras sobre a última leitura (ponto de encaixe para um LLM)
function assistant(a, last) {
  if (!last) return 'Ainda não há observações de ' + a.name + '. Marque os comportamentos do dia para eu poder ajudar.';
  const ev = outObs(a, last), cat = new Map(behaviorsFor(a.species).map(b => [b.key, b.label]));
  const bad = ev.behaviors.filter(k => (behaviorsFor(a.species).find(b => b.key === k)?.weight ?? 0) < 0).map(k => cat.get(k).toLowerCase());
  return `${a.name} está "${ev.label}" (pontuação ${ev.score > 0 ? '+' : ''}${ev.score}). ${ev.tip}` +
    (bad.length ? ` Sinais a observar: ${bad.join('; ')}.` : '') + ' ' + DISCLAIMER;
}

// ---------- Rotas ----------
const R = [];
const route = (method, re, auth, fn) => R.push({ method, re: new RegExp('^' + re + '$'), auth, fn });

route('GET', '/api/health', 0, () => [200, { ok: true, ts: Date.now() }]);
route('POST', '/api/auth/register', 0, ({ body }) => {
  const email = str(body.email, 120)?.toLowerCase();
  need(email && /^\S+@\S+\.\S+$/.test(email), 'e-mail inválido');
  need(typeof body.password === 'string' && body.password.length >= 8, 'senha deve ter ao menos 8 caracteres');
  if (q.userByEmail.get(email)) throw new Err(409, 'e-mail já cadastrado');
  const r = q.addUser.run(email, hashPw(body.password), Date.now());
  return [201, session({ id: Number(r.lastInsertRowid), email })];
});
route('POST', '/api/auth/login', 0, ({ body }) => {
  const email = str(body.email, 120)?.toLowerCase() || '';
  if (throttled(email)) throw new Err(429, 'muitas tentativas, aguarde alguns minutos');
  const u = q.userByEmail.get(email);
  if (!u || typeof body.password !== 'string' || !checkPw(body.password, u.hash)) throw new Err(401, 'e-mail ou senha incorretos');
  return [200, session(u)];
});
route('GET', '/api/me', 1, ({ user }) => [200, { id: user.id, email: user.email }]);

route('GET', '/api/species', 0, () => [200, Object.entries(SPECIES).map(([key, label]) => ({ key, label }))]);
route('GET', '/api/catalog', 0, ({ url }) => {
  const sp = url.searchParams.get('species'); need(SPECIES[sp], 'informe ?species=' + Object.keys(SPECIES).join('|'));
  const list = behaviorsFor(sp);
  return [200, { species: sp, label: SPECIES[sp], levels: LEVELS.map(({ key, label, color, min }) => ({ key, label, color, min: isFinite(min) ? min : null })),
    groups: Object.entries(GROUPS).map(([key, label]) => ({ key, label, behaviors: list.filter(b => b.group === key) })) }];
});
route('POST', '/api/score', 0, ({ body }) => { // prévia sem salvar (alimenta o medidor em tempo real)
  need(SPECIES[body.species], 'species inválida'); need(Array.isArray(body.behaviors), 'behaviors deve ser uma lista de chaves');
  return [200, evaluate(body.species, body.behaviors.map(String))];
});

route('GET', '/api/animals', 1, ({ user }) => [200, q.animals.all(user.id).map(a => ({ ...outAnimal(a), status: outObs(a, q.lastObs.get(a.id)) }))]);
route('POST', '/api/animals', 1, ({ user, body }) => {
  const r = q.addAnimal.run(user.id, ...animalBody(body), Date.now());
  return [201, outAnimal(q.animal.get(Number(r.lastInsertRowid), user.id))];
});
route('GET', '/api/animals/(\\d+)', 1, ({ user, m }) => { const a = animalOr404(m[1], user); return [200, { ...outAnimal(a), status: outObs(a, q.lastObs.get(a.id)) }]; });
route('PATCH', '/api/animals/(\\d+)', 1, ({ user, m, body }) => {
  const a = animalOr404(m[1], user); q.updAnimal.run(...animalBody(body, a), a.id); return [200, outAnimal(q.animal.get(a.id, user.id))];
});
route('DELETE', '/api/animals/(\\d+)', 1, ({ user, m }) => { q.delAnimal.run(animalOr404(m[1], user).id); return [204, null]; });

route('POST', '/api/animals/(\\d+)/observations', 1, ({ user, m, body }) => {
  const a = animalOr404(m[1], user); need(Array.isArray(body.behaviors), 'behaviors deve ser uma lista de chaves');
  const ev = evaluate(a.species, body.behaviors.map(String)); need(!ev.unknown.length, 'comportamentos inválidos para ' + a.species + ': ' + ev.unknown.join(', '));
  const ts = Date.now(); const r = q.addObs.run(a.id, ts, JSON.stringify(ev.behaviors), ev.score, ev.level, str(body.note, 500));
  return [201, { id: Number(r.lastInsertRowid), ts, ...ev }];
});
route('GET', '/api/animals/(\\d+)/status', 1, ({ user, m }) => { const a = animalOr404(m[1], user); const o = q.lastObs.get(a.id); return o ? [200, outObs(a, o)] : [404, { error: 'sem observações' }]; });
route('GET', '/api/animals/(\\d+)/history', 1, ({ user, m, url }) => {
  const a = animalOr404(m[1], user), days = Math.min(365, +url.searchParams.get('days') || 30), limit = Math.min(200, +url.searchParams.get('limit') || 50);
  return [200, { days, items: q.obs.all(a.id, Date.now() - days * 864e5, limit).map(o => outObs(a, o)) }];
});

route('GET', '/api/animals/(\\d+)/vaccines', 1, ({ user, m }) => [200, q.vacs.all(animalOr404(m[1], user).id).map(outVac)]);
route('POST', '/api/animals/(\\d+)/vaccines', 1, ({ user, m, body }) => {
  const a = animalOr404(m[1], user), name = str(body.name, 80), on = str(body.appliedOn, 10), nx = str(body.nextDose, 10);
  need(name, 'name da vacina é obrigatório'); need(on && isDate(on), 'appliedOn deve ser AAAA-MM-DD');
  need(!nx || (isDate(nx) && nx >= on), 'nextDose deve ser AAAA-MM-DD e não anterior a appliedOn');
  return [201, outVac(q.vac.get(Number(q.addVac.run(a.id, name, on, nx).lastInsertRowid), user.id))];
});
route('DELETE', '/api/vaccines/(\\d+)', 1, ({ user, m }) => { if (!q.vac.get(+m[1], user.id)) throw new Err(404, 'vacina não encontrada'); q.delVac.run(+m[1]); return [204, null]; });

route('GET', '/api/animals/(\\d+)/diary', 1, ({ user, m, url }) =>
  [200, q.diary.all(animalOr404(m[1], user).id, Math.min(100, +url.searchParams.get('limit') || 30)).map(d => ({ id: d.id, ts: d.ts, text: d.text }))]);
route('POST', '/api/animals/(\\d+)/diary', 1, ({ user, m, body }) => {
  const a = animalOr404(m[1], user), text = str(body.text, 1000); need(text, 'text é obrigatório'); const ts = Date.now();
  return [201, { id: Number(q.addDiary.run(a.id, ts, text).lastInsertRowid), ts, text }];
});
route('DELETE', '/api/diary/(\\d+)', 1, ({ user, m }) => { if (!q.entry.get(+m[1], user.id)) throw new Err(404, 'entrada não encontrada'); q.delDiary.run(+m[1]); return [204, null]; });
route('POST', '/api/animals/(\\d+)/assistant', 1, ({ user, m }) => { const a = animalOr404(m[1], user); return [200, { answer: assistant(a, q.lastObs.get(a.id)) }]; });

// ---------- Servidor ----------
const readBody = req => new Promise((ok, no) => {
  let b = ''; req.on('data', d => { b += d; if (b.length > 1e5) { no(new Err(413, 'corpo muito grande')); req.destroy(); } });
  req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch { no(new Err(400, 'JSON inválido')); } });
});
http.createServer(async (req, res) => {
  const send = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(data === null ? undefined : JSON.stringify(data)); };
  res.setHeader('Access-Control-Allow-Origin', ORIGIN); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  try {
    const url = new URL(req.url, 'http://x');
    for (const r of R) {
      const m = r.method === req.method && url.pathname.match(r.re); if (!m) continue;
      let user = null;
      if (r.auth) {
        const p = verify((req.headers.authorization || '').replace(/^Bearer /, ''));
        user = p && db.prepare('SELECT id,email FROM users WHERE id=?').get(p.sub);
        if (!user) throw new Err(401, 'não autenticado');
      }
      const [code, data] = r.fn({ m, url, user, body: ['POST', 'PATCH'].includes(req.method) ? await readBody(req) : {} });
      return send(code, data);
    }
    send(404, { error: 'rota não encontrada' });
  } catch (e) { if (!(e instanceof Err)) console.error(e); send(e.code || 500, { error: e instanceof Err ? e.message : 'erro interno' }); }
}).listen(PORT, () => console.log(`Animal Controller API em http://localhost:${PORT}`));
