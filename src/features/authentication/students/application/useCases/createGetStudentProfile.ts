import type { StudentRepository } from "../../domain/repositories/StudentRepository";
import type { StudentProfile } from "@/features/authentication/students/domain/entities/student";

export const createGetStudentProfile = (repository: StudentRepository) => {
  return async (): Promise<StudentProfile> => {
    return repository.getProfile();
  };
};
