const ACCOUNTS_KEY = "animal-controller.demo.accounts.v1";
const SESSION_KEY = "animal-controller.demo.session.v1";

type DemoAccount = { email: string; salt: string; passwordHash: string };

function readAccounts(): DemoAccount[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter(
      (item): item is DemoAccount =>
        typeof item === "object" && item !== null &&
        typeof item.email === "string" && typeof item.salt === "string" &&
        typeof item.passwordHash === "string",
    );
  } catch {
    return [];
  }
}

function hashPassword(password: string, salt: string): Promise<string> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${password}`))
    .then((buffer) => Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join(""));
}

export function getDemoSession(): string | null {
  try {
    const email = localStorage.getItem(SESSION_KEY);
    return email && readAccounts().some((account) => account.email === email) ? email : null;
  } catch {
    return null;
  }
}

export async function authenticateDemo(
  mode: "login" | "register",
  rawEmail: string,
  password: string,
): Promise<{ email?: string; error?: string }> {
  const email = rawEmail.trim().toLocaleLowerCase("en-US");
  try {
    const accounts = readAccounts();
    const existing = accounts.find((account) => account.email === email);
    if (mode === "register") {
      if (existing) return { error: "Este e-mail já tem uma conta neste navegador. Entre com sua senha." };
      const salt = crypto.randomUUID();
      accounts.push({ email, salt, passwordHash: await hashPassword(password, salt) });
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } else {
      if (!existing || (await hashPassword(password, existing.salt)) !== existing.passwordHash) {
        return { error: "E-mail ou senha incorretos. Confira seus dados ou crie uma conta." };
      }
    }
    localStorage.setItem(SESSION_KEY, email);
    return { email };
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
    account.salt = crypto.randomUUID();
    account.passwordHash = await hashPassword(password, account.salt);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    return {};
  } catch {
    return { error: "Não foi possível atualizar a senha neste navegador. Tente novamente." };
  }
}

export function endDemoSession() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* Storage can be unavailable in private modes. */ }
}
