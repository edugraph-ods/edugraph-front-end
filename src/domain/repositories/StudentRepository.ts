import type { StudentProfile } from "@/domain/entities/student";

export interface StudentRepository {
  getProfile(): Promise<StudentProfile>;
}
