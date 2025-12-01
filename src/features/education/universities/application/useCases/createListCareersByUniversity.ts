import type { Career } from "@/features/education/careers/domain/entities/career";
import type { UniversityRepository } from "@/features/education/universities/domain/repositories/UniversityRepository";

export const createListCareersByUniversity = (repo: UniversityRepository) => {
  return async (universityId: string): Promise<Career[]> => {
    if (!universityId) return [];
    const careers = await repo.listCareersByUniversity(universityId);
    return careers;
  };
};
