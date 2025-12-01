import type { StudentProfile } from "@/features/authentication/students/domain/entities/student";

export interface StudentRepository {
  getProfile(): Promise<StudentProfile>;
}
