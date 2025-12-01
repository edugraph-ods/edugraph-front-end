import { useMemo } from "react";
import { createStudentRepository } from "../../infrastructure/repositories/StudentRepositoryImpl";
import { createGetStudentProfile } from "../../application/useCases/createGetStudentProfile";
import type { StudentProfile } from "../../domain/entities/student";

interface UseStudentApi {
  getProfile(): Promise<StudentProfile>;
}

export const useStudent = (): UseStudentApi => {
  const repository = useMemo(() => createStudentRepository(), []);

  const api = useMemo(() => {
    const getProfile = createGetStudentProfile(repository);
    return { getProfile } satisfies UseStudentApi;
  }, [repository]);

  return api;
};
