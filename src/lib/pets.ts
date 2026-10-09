export type Pet = {
  id: string;
  name: string;
  tutorName?: string;
  species: string;
  breed: string;
  birthDate: string;
  photo: string;
  createdAt: string;
  adoptionAvailable?: boolean;
  size?: string;
  city?: string;
  description?: string;
  activities?: PetRecord[];
  observations?: PetRecord[];
  veterinaryVisits?: PetRecord[];
  medications?: PetRecord[];
  vaccinations?: PetRecord[];
};

export type PetRecord = {
  id: string;
  title: string;
  details: string;
  date: string;
  nextDose?: string;
  createdAt: string;
  severity?: number;
  mood?: "positive" | "neutral" | "concern";
};

export type AdoptionInterest = {
  id: string;
  petId: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  createdAt: string;
};

const STORAGE_KEY = "animal-controller-pets-v1";
const INTERESTS_KEY = "animal-controller-adoption-interests-v1";

export function readPets(): Pet[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? (value as Pet[]) : [];
  } catch {
    return [];
  }
}

export function writePets(pets: Pet[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pets));
}

export function readAdoptionInterests(): AdoptionInterest[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(INTERESTS_KEY) ?? "[]");
    return Array.isArray(value) ? (value as AdoptionInterest[]) : [];
  } catch {
    return [];
  }
}

export function registerAdoptionInterest(interest: Omit<AdoptionInterest, "id" | "createdAt">) {
  const next: AdoptionInterest[] = [{ ...interest, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...readAdoptionInterests()];
  window.localStorage.setItem(INTERESTS_KEY, JSON.stringify(next));
}

export function petAge(birthDate: string) {
  if (!birthDate) return "Idade não informada";
  const birth = new Date(`${birthDate}T12:00:00`);
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) return "Data futura";
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  if (years === 0) return `${Math.max(0, months)} ${months === 1 ? "mês" : "meses"}`;
  return `${years} ${years === 1 ? "ano" : "anos"}${remaining ? ` e ${remaining} ${remaining === 1 ? "mês" : "meses"}` : ""}`;
}

export const SPECIES_NAMES: Record<string, string> = {
  dog: "Cão", cat: "Gato", bird: "Ave", rabbit: "Coelho", "guinea-pig": "Porquinho-da-índia", horse: "Cavalo", hamster: "Hamster", other: "Outro",
};
