import type { CareerRepository } from "../../domain/repositories/CareerRepository";
import type { Career } from "../../domain/entities/career";
import type { Course } from "../../../courses/domain/entities/course";
import type { AcademicProgressRequest, AcademicProgressResponse } from "../../../academic_progress/domain/entities/progress";
import { CoursePlanner } from "../../../courses/domain/services/CoursePlanner";
import { getJson, postJson } from "../../../../shared/infrastructure/http/apiClient";
import { PATH_CAREERS, buildCareerCoursesPath, buildCareerProgressPath, buildCareerMinPrereqsPath, buildCareerPersonalizedProgressPath } from "../../../../shared/infrastructure/http/apiPaths";

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
  const code = typeof payload?.code === "string" ? payload.code : null;
  const cycle = typeof payload?.cycle === "number" ? payload.cycle : Number(payload?.cycle ?? 0);
  const credits = typeof payload?.credits === "number" ? payload.credits : Number(payload?.credits ?? 0);
  const prereqs = Array.isArray(payload?.prereqs)
    ? (payload?.prereqs as unknown[]).filter((p): p is string => typeof p === "string")
    : [];
  if (!id || !name) return null;
  return {
    id,
    name,
    code: code || id,
    credits: Number.isFinite(credits) ? credits : 0,
    cycle: Number.isFinite(cycle) ? cycle : 0,
    prerequisites: prereqs,
    status: "not_taken",
  };
};

export const createCareerRepository = (): CareerRepository => {
  const listCareers: CareerRepository["listCareers"] = async () => {
    const response = await getJson<unknown>(PATH_CAREERS);
    return Array.isArray(response)
      ? response
          .map((item) => (typeof item === "object" && item !== null ? toCareer(item as ApiCareer) : null))
          .filter((c): c is Career => c !== null)
      : [];
  };

  const listCoursesByCareer: CareerRepository["listCoursesByCareer"] = async (careerId: string) => {
    if (!careerId) return [];
    const response = await getJson<unknown>(buildCareerCoursesPath(careerId));
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

    if (courses.length > 0) {
      const planner = new CoursePlanner(courses);
      return planner.getCourses();
    }
    
    return courses;
  };

  const calculateAcademicProgress: CareerRepository["calculateAcademicProgress"] = async (
    careerId: string,
    payload: AcademicProgressRequest
  ) => {
    if (!careerId) throw new Error("careerId is required");
    const path = buildCareerProgressPath(careerId);
    const response = await postJson<unknown>(path, payload);
    const data = typeof response === "object" && response !== null ? (response as Record<string, unknown>) : {};
    const cycles = Number(data["cycles_needed_to_graduate"] ?? 0);
    const months = Number(data["months_needed_to_graduate"] ?? 0);
    const years = Number(data["years_needed_to_graduate"] ?? 0);
    return {
      cycles_needed_to_graduate: Number.isFinite(cycles) ? cycles : 0,
      months_needed_to_graduate: Number.isFinite(months) ? months : 0,
      years_needed_to_graduate: Number.isFinite(years) ? years : 0,
    } as AcademicProgressResponse;
  };

  const getMinPrerequisites: CareerRepository["getMinPrerequisites"] = async (
    careerId: string,
    courseId: string
  ) => {
    if (!careerId) throw new Error("careerId is required");
    if (!courseId) throw new Error("courseId is required");
    const path = buildCareerMinPrereqsPath(careerId, courseId);
    const response = await getJson<unknown>(path);
    const data = typeof response === "object" && response !== null ? (response as Record<string, unknown>) : {};
    const course_id = typeof data["course_id"] === "string" ? data["course_id"] : courseId;
    const min_courses_required = Number(data["min_courses_required"] ?? 0) || 0;
    const listRaw = Array.isArray(data["courses_in_order"]) ? (data["courses_in_order"] as unknown[]) : [];
    const courses_in_order = listRaw
      .map((item) => (typeof item === "object" && item !== null ? (item as Record<string, unknown>) : null))
      .filter((v): v is Record<string, unknown> => v !== null)
      .map((v) => ({
        id: typeof v.id === "string" ? v.id : "",
        name: typeof v.name === "string" ? v.name : "",
        code: typeof v.code === "string" ? v.code : "",
      }));

    return { course_id, min_courses_required, courses_in_order };
  };

  const getPersonalizedProgress: CareerRepository["getPersonalizedProgress"] = async (
    careerId: string,
    payload: AcademicProgressRequest
  ) => {
    if (!careerId) throw new Error("careerId is required");
    const path = buildCareerPersonalizedProgressPath(careerId);
    const approved: string[] = Array.isArray(payload?.cycles)
      ? payload.cycles.flatMap((cy) =>
          Array.isArray(cy.courses)
            ? cy.courses.filter((c) => c.status === "PASSED").map((c) => c.id)
            : []
        )
      : [];
    const requestBody = { approved_courses: approved };
    const response = await postJson<unknown>(path, requestBody);
    const list = Array.isArray(response) ? (response as unknown[]) : [];
    return list
      .map((item) => (typeof item === "object" && item !== null ? (item as Record<string, unknown>) : null))
      .filter((v): v is Record<string, unknown> => v !== null)
      .map((v) => ({
        course_id: typeof v.course_id === "string" ? v.course_id : "",
        name: typeof v.name === "string" ? v.name : "",
        cycle: Number(v.cycle ?? 0) || 0,
        distance: Number(v.distance ?? 0) || 0,
      }));
  };

  return {
    listCareers,
    listCoursesByCareer,
    calculateAcademicProgress,
    getMinPrerequisites,
    getPersonalizedProgress,
  };
};
