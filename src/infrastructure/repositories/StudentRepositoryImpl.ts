import type { StudentRepository } from "@/domain/repositories/StudentRepository";
import type { StudentProfile } from "@/domain/entities/student";
import { getJson } from "@/infrastructure/http/apiClient";
import { PATH_STUDENTS_ME } from "@/infrastructure/http/apiPaths";

type ApiStudentProfile = {
  id?: unknown;
  name?: unknown;
  email?: unknown;
  university?: unknown;
  university_id?: unknown;
};

const toStudentProfile = (payload: ApiStudentProfile | null | undefined): StudentProfile => ({
  id: typeof payload?.id === "string" && payload.id.trim().length > 0 ? payload.id : null,
  name: typeof payload?.name === "string" && payload.name.trim().length > 0 ? payload.name : null,
  email: typeof payload?.email === "string" && payload.email.trim().length > 0 ? payload.email : null,
  university:
    typeof payload?.university === "string" && payload.university.trim().length > 0
      ? payload.university
      : null,
  university_id:
    typeof payload?.university_id === "string" && payload.university_id.trim().length > 0
      ? payload.university_id
      : null,
});

export const createStudentRepository = (): StudentRepository => {
  const getProfile: StudentRepository["getProfile"] = async () => {
    const response = await getJson<ApiStudentProfile>(PATH_STUDENTS_ME);
    return toStudentProfile(response);
  };

  return {
    getProfile,
  };
};
