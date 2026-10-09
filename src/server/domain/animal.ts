/** Core animal profile used by the API and persistence adapters. */
export type AnimalSpecies = "dog" | "cat" | "bird" | "rabbit" | "other";

export type DiaryEntry = {
  id: string;
  activity: string;
  createdAt: string;
};

export type VaccinationEntry = {
  id: string;
  name: string;
  date: string;
  nextDose: string;
};

export type AnimalProfile = {
  id: string;
  tutorId: string;
  tutorName: string;
  animalName: string;
  animalAge: string;
  species: AnimalSpecies;
  diary: DiaryEntry[];
  vaccinations: VaccinationEntry[];
  createdAt: string;
  updatedAt: string;
};
