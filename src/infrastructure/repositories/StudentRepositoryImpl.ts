import type { StudentRepository } from "@/domain/repositories/StudentRepository";
import type { StudentProfile } from "@/domain/entities/student";
import { getJson } from "@/infrastructure/http/apiClient";

const STUDENT_PROFILE_PATH = "/api/v1/students/me";

type ApiStudentProfile = {
  name?: unknown;
  email?: unknown;
  university?: unknown;
};

const toStudentProfile = (payload: ApiStudentProfile | null | undefined): StudentProfile => ({
  name: typeof payload?.name === "string" && payload.name.trim().length > 0 ? payload.name : null,
  email: typeof payload?.email === "string" && payload.email.trim().length > 0 ? payload.email : null,
  university:
    typeof payload?.university === "string" && payload.university.trim().length > 0
      ? payload.university
      : null,
});

export const createStudentRepository = (): StudentRepository => {
  const getProfile: StudentRepository["getProfile"] = async () => {
    const response = await getJson<ApiStudentProfile>(STUDENT_PROFILE_PATH);
    return toStudentProfile(response);
  };

  return {
    getProfile,
  };
};
