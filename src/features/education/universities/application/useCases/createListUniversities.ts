import type { University } from "@/features/shared/domain/entities/university";
import type { UniversityRepository } from "@/features/education/universities/domain/repositories/UniversityRepository";

export const createListUniversities = (repo: UniversityRepository) => {
  return async (): Promise<University[]> => {
    const universities = await repo.listUniversities();
    return universities;
  };
};
