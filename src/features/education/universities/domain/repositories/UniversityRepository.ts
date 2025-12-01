import type { University } from "@/features/shared/domain/entities/university";
import type { Career } from "../../../careers/domain/entities/career";

export interface UniversityRepository {
  listUniversities(): Promise<University[]>;
  listCareersByUniversity(universityId: string): Promise<Career[]>;
}
