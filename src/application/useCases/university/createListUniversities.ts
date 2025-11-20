import type { University } from "@/domain/entities/university";
import type { UniversityRepository } from "@/domain/repositories/UniversityRepository";

export const createListUniversities = (repo: UniversityRepository) => {
  return async (): Promise<University[]> => {
    const universities = await repo.listUniversities();
    return universities;
  };
};
