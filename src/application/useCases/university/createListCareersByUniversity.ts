import type { Career } from "@/domain/entities/career";
import type { UniversityRepository } from "@/domain/repositories/UniversityRepository";

export const createListCareersByUniversity = (repo: UniversityRepository) => {
  return async (universityId: string): Promise<Career[]> => {
    if (!universityId) return [];
    const careers = await repo.listCareersByUniversity(universityId);
    return careers;
  };
};
