import { useMemo } from "react";
import { createUniversityRepository } from "@/infrastructure/repositories/UniversityRepositoryImpl";
import { createListUniversities } from "@/application/useCases/university/createListUniversities";
import { createListCareersByUniversity } from "@/application/useCases/university/createListCareersByUniversity";
import type { University } from "@/domain/entities/university";
import type { Career } from "@/domain/entities/career";

interface UseUniversityApi {
  listUniversities(): Promise<University[]>;
  listCareersByUniversity(universityId: string): Promise<Career[]>;
}

export const useUniversity = (): UseUniversityApi => {
  const repository = useMemo(() => createUniversityRepository(), []);

  const api = useMemo(() => {
    const listUniversities = createListUniversities(repository);
    const listCareersByUniversity = createListCareersByUniversity(repository);
    return { listUniversities, listCareersByUniversity } satisfies UseUniversityApi;
  }, [repository]);

  return api;
};
