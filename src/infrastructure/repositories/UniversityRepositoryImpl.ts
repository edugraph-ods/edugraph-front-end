import type { UniversityRepository } from "@/domain/repositories/UniversityRepository";
import type { University } from "@/domain/entities/university";
import type { Career } from "@/domain/entities/career";
import { getJson } from "@/infrastructure/http/apiClient";
import { PATH_UNIVERSITIES, buildUniversityCareersPath } from "@/infrastructure/http/apiPaths";

interface ApiUniversity {
  id?: unknown;
  name?: unknown;
  acronym?: unknown;
}

interface ApiCareer {
  id?: unknown;
  name?: unknown;
  program?: unknown;
}

const toUniversity = (payload: ApiUniversity): University | null => {
  const id = typeof payload?.id === "string" ? payload.id : null;
  const name = typeof payload?.name === "string" ? payload.name : null;
  const acronym = typeof payload?.acronym === "string" ? payload.acronym : null;
  if (!id || !name) return null;
  return { id, name, acronym };
};

const toCareer = (payload: ApiCareer): Career | null => {
  const id = typeof payload?.id === "string" ? payload.id : null;
  const name = typeof payload?.name === "string" ? payload.name : null;
  const program = typeof payload?.program === "string" ? payload.program : null;
  if (!id || !name) return null;
  return { id, name, program };
};

export const createUniversityRepository = (): UniversityRepository => {
  const listUniversities: UniversityRepository["listUniversities"] = async () => {
    const response = await getJson<unknown>(PATH_UNIVERSITIES);
    return Array.isArray(response)
      ? response
          .map((item) => (typeof item === "object" && item !== null ? toUniversity(item as ApiUniversity) : null))
          .filter((u): u is University => u !== null)
      : [];
  };

  const listCareersByUniversity: UniversityRepository["listCareersByUniversity"] = async (
    universityId: string
  ) => {
    const response = await getJson<unknown>(buildUniversityCareersPath(universityId));
    return Array.isArray(response)
      ? response
          .map((item) => (typeof item === "object" && item !== null ? toCareer(item as ApiCareer) : null))
          .filter((c): c is Career => c !== null)
      : [];
  };

  return {
    listUniversities,
    listCareersByUniversity,
  };
};
