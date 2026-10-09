import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { animal, diaryEntry, vaccination } from "../db/schema";

export type ProfileInput = {
  tutorName: string;
  animalName: string;
  animalAge: string;
  species: "dog" | "cat" | "bird" | "rabbit" | "guinea-pig" | "horse" | "hamster";
  diary: { id: string; activity: string; createdAt: string }[];
  vaccinations: { id: string; name: string; date: string; nextDose: string }[];
};

export async function readProfile(tutorId: string): Promise<ProfileInput> {
  const [record] = await db.select().from(animal).where(eq(animal.tutorId, tutorId)).limit(1);
  if (!record) return { tutorName: "", animalName: "", animalAge: "", species: "dog", diary: [], vaccinations: [] };
  const [diary, vaccinations] = await Promise.all([
    db.select().from(diaryEntry).where(eq(diaryEntry.animalId, record.id)).orderBy(diaryEntry.createdAt),
    db.select().from(vaccination).where(eq(vaccination.animalId, record.id)).orderBy(vaccination.date),
  ]);
  return {
    tutorName: record.tutorName,
    animalName: record.animalName,
    animalAge: record.animalAge,
    species: record.species,
    diary: diary.map(({ id, activity, createdAt }) => ({ id, activity, createdAt: createdAt.toISOString() })),
    vaccinations: vaccinations.map(({ id, name, date, nextDose }) => ({ id, name, date, nextDose: nextDose ?? "" })),
  };
}

export async function saveProfile(tutorId: string, value: ProfileInput): Promise<ProfileInput> {
  return db.transaction(async (tx) => {
    const { diary, vaccinations, ...animalFields } = value;
    const [current] = await tx.select({ id: animal.id }).from(animal).where(eq(animal.tutorId, tutorId)).limit(1);
    const animalId = current?.id ?? crypto.randomUUID();
    const now = new Date();
    if (current) {
      await tx.update(animal).set({ ...animalFields, tutorId, updatedAt: now }).where(and(eq(animal.id, animalId), eq(animal.tutorId, tutorId)));
    } else {
      await tx.insert(animal).values({ id: animalId, tutorId, ...animalFields, createdAt: now, updatedAt: now });
    }
    await tx.delete(diaryEntry).where(eq(diaryEntry.animalId, animalId));
    if (diary.length) await tx.insert(diaryEntry).values(diary.map((entry) => ({
      id: entry.id, animalId, activity: entry.activity, createdAt: new Date(entry.createdAt),
    })));
    await tx.delete(vaccination).where(eq(vaccination.animalId, animalId));
    if (vaccinations.length) await tx.insert(vaccination).values(vaccinations.map((entry) => ({
      id: entry.id, animalId, name: entry.name, date: entry.date, nextDose: entry.nextDose || null,
    })));
    return value;
  });
}
