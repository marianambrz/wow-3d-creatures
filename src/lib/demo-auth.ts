const ACCOUNTS_KEY = "animal-controller.demo.accounts.v1";
const SESSION_KEY = "animal-controller.demo.session.v1";

export type DemoRole = "tutor" | "veterinarian";
export type DemoUser = { email: string; role: DemoRole; councilNumber: string };
type DemoAccount = { email: string; salt: string; passwordHash: string; role?: DemoRole; councilNumber?: string };

function createSalt(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function readAccounts(): DemoAccount[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is DemoAccount =>
        typeof item === "object" && item !== null &&
        typeof item.email === "string" && typeof item.salt === "string" &&
        typeof item.passwordHash === "string",
    ).map((account) => ({
      ...account,
      role: account.role === "veterinarian" ? "veterinarian" : "tutor",
      councilNumber: typeof account.councilNumber === "string" ? account.councilNumber : "",
    }));
  } catch {
    return [];
  }
}

function fallbackHash(value: string): string {
  // Keeps the local-only demo usable on non-secure HTTP origins where Web Crypto is unavailable.
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `demo-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const value = `${salt}:${password}`;
  if (globalThis.crypto?.subtle && typeof TextEncoder !== "undefined") {
    const buffer = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    const digest = Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `sha256-${digest}`;
  }
  return fallbackHash(value);
}

async function matchesPassword(password: string, account: DemoAccount): Promise<boolean> {
  if (account.passwordHash.startsWith("sha256-")) {
    return (await hashPassword(password, account.salt)) === account.passwordHash;
  }
  if (account.passwordHash.startsWith("demo-")) {
    return fallbackHash(`${account.salt}:${password}`) === account.passwordHash;
  }
  // Legacy accounts used an unprefixed SHA-256 digest.
  if (/^[a-f\d]{64}$/i.test(account.passwordHash)) {
    if (!globalThis.crypto?.subtle || typeof TextEncoder === "undefined") return false;
    const buffer = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${account.salt}:${password}`));
    const digest = Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
    return digest === account.passwordHash;
  }
  return hashPassword(password, account.salt).then((hash) => hash === account.passwordHash);
}

export function getDemoSession(): DemoUser | null {
  try {
    const email = localStorage.getItem(SESSION_KEY);
    const account = email ? readAccounts().find((item) => item.email === email) : undefined;
    return account ? { email: account.email, role: account.role ?? "tutor", councilNumber: account.councilNumber ?? "" } : null;
  } catch {
    return null;
  }
}

export async function authenticateDemo(
  mode: "login" | "register",
  rawEmail: string,
  password: string,
  details: { role: DemoRole; councilNumber: string } = { role: "tutor", councilNumber: "" },
): Promise<(DemoUser & { error?: never }) | { error: string }> {
  const email = rawEmail.trim().toLocaleLowerCase("en-US");
  if (!email || !password) return { error: "Informe o e-mail e a senha." };
  try {
    const accounts = readAccounts();
    const existing = accounts.find((account) => account.email === email);
    if (mode === "register") {
      if (existing) return { error: "Este e-mail já tem uma conta neste navegador. Entre com sua senha." };
      if (details.role === "veterinarian" && !details.councilNumber.trim()) return { error: "Informe o número do CRMV para criar uma conta veterinária." };
      const salt = createSalt();
      accounts.push({ email, salt, passwordHash: await hashPassword(password, salt), role: details.role, councilNumber: details.role === "veterinarian" ? details.councilNumber.trim() : "" });
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } else {
      if (!existing || !(await matchesPassword(password, existing))) {
        return { error: "E-mail ou senha incorretos. Confira seus dados ou crie uma conta." };
      }
    }
    localStorage.setItem(SESSION_KEY, email);
    return { email, role: existing?.role ?? (mode === "register" ? details.role : "tutor"), councilNumber: existing?.councilNumber ?? (mode === "register" && details.role === "veterinarian" ? details.councilNumber.trim() : "") };
  } catch {
    return { error: "Não foi possível salvar o acesso neste navegador. Verifique as configurações de armazenamento e tente novamente." };
  }
}

export async function resetDemoPassword(rawEmail: string, password: string): Promise<{ error?: string }> {
  const email = rawEmail.trim().toLocaleLowerCase("en-US");
  try {
    const accounts = readAccounts();
    const account = accounts.find((item) => item.email === email);
    if (!account) return { error: "Não encontramos uma conta com esse e-mail neste navegador." };
    account.salt = createSalt();
    account.passwordHash = await hashPassword(password, account.salt);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return {};
  } catch {
    return { error: "Não foi possível atualizar a senha neste navegador. Tente novamente." };
  }
}

export async function deleteDemoAccount(rawEmail: string, password: string): Promise<{ error?: string }> {
  const email = rawEmail.trim().toLocaleLowerCase("en-US");
  try {
    const accounts = readAccounts();
    const account = accounts.find((item) => item.email === email);
    if (!account || !(await matchesPassword(password, account))) {
      return { error: "E-mail ou senha incorretos. A conta não foi removida." };
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.filter((item) => item.email !== email)));
    if (localStorage.getItem(SESSION_KEY) === email) localStorage.removeItem(SESSION_KEY);
    return {};
  } catch {
    return { error: "Não foi possível remover a conta deste navegador. Tente novamente." };
  }
}

export function endDemoSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* Storage can be unavailable in private modes. */ }
}
