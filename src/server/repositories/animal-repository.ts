import type { AnimalProfile } from "../domain/animal";

/** Persistence boundary; adapters can target a database without changing API handlers. */
export interface AnimalRepository {
  findById(id: string): Promise<AnimalProfile | null>;
  findByTutorId(tutorId: string): Promise<AnimalProfile[]>;
  save(profile: AnimalProfile): Promise<AnimalProfile>;
  delete(id: string): Promise<void>;
}
