import type { University } from "@/domain/entities/university";
import type { Career } from "@/domain/entities/career";

export interface UniversityRepository {
  listUniversities(): Promise<University[]>;
  listCareersByUniversity(universityId: string): Promise<Career[]>;
}
