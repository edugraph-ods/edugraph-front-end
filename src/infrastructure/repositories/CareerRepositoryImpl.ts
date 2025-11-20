import type { CareerRepository } from "@/domain/repositories/CareerRepository";
import type { Career } from "@/domain/entities/career";
import type { Course } from "@/domain/entities/course";
import { getJson } from "@/infrastructure/http/apiClient";

const CAREERS_PATH = "/api/v1/careers";

// API payload shapes
interface ApiCareer {
  id?: unknown;
  name?: unknown;
  program?: unknown;
}

interface ApiCoursesByCareerResponse {
  total_courses?: unknown;
  cycles?: unknown;
}

interface ApiCycle {
  cycle?: unknown;
  courses?: unknown;
}

interface ApiCourseItem {
  id?: unknown;
  name?: unknown;
  code?: unknown;
  cycle?: unknown;
  credits?: unknown;
  prereqs?: unknown;
}

const toCareer = (payload: ApiCareer): Career | null => {
  const id = typeof payload?.id === "string" ? payload.id : null;
  const name = typeof payload?.name === "string" ? payload.name : null;
  const program = typeof payload?.program === "string" ? payload.program : null;
  if (!id || !name) return null;
  return { id, name, program };
};

const toCourse = (payload: ApiCourseItem): Course | null => {
  const id = typeof payload?.id === "string" ? payload.id : null;
  const name = typeof payload?.name === "string" ? payload.name : null;
  const cycle = typeof payload?.cycle === "number" ? payload.cycle : Number(payload?.cycle ?? 0);
  const credits = typeof payload?.credits === "number" ? payload.credits : Number(payload?.credits ?? 0);
  const prereqs = Array.isArray(payload?.prereqs)
    ? (payload?.prereqs as unknown[]).filter((p): p is string => typeof p === "string")
    : [];
  if (!id || !name) return null;
  return {
    id,
    name,
    credits: Number.isFinite(credits) ? credits : 0,
    cycle: Number.isFinite(cycle) ? cycle : 0,
    prerequisites: prereqs,
    status: "not_taken",
  };
};

export const createCareerRepository = (): CareerRepository => {
  const listCareers: CareerRepository["listCareers"] = async () => {
    const response = await getJson<unknown>(CAREERS_PATH);
    return Array.isArray(response)
      ? response
          .map((item) => (typeof item === "object" && item !== null ? toCareer(item as ApiCareer) : null))
          .filter((c): c is Career => c !== null)
      : [];
  };

  const listCoursesByCareer: CareerRepository["listCoursesByCareer"] = async (careerId: string) => {
    if (!careerId) return [];
    const response = await getJson<unknown>(`${CAREERS_PATH}/${encodeURIComponent(careerId)}/courses`);
    const data = (typeof response === "object" && response !== null ? (response as ApiCoursesByCareerResponse) : null);
    const cycles = Array.isArray(data?.cycles) ? (data?.cycles as unknown[]) : [];
    const courses: Course[] = [];
    for (const cy of cycles) {
      const cycleObj = typeof cy === "object" && cy !== null ? (cy as ApiCycle) : null;
      const items = Array.isArray(cycleObj?.courses) ? (cycleObj?.courses as unknown[]) : [];
      for (const raw of items) {
        const mapped = typeof raw === "object" && raw !== null ? toCourse(raw as ApiCourseItem) : null;
        if (mapped) courses.push({ ...mapped, career: careerId });
      }
    }
    return courses;
  };

  return {
    listCareers,
    listCoursesByCareer,
  };
};
