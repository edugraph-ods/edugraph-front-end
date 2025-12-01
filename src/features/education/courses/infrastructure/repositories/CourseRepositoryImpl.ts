import type { CourseRepository } from "../../domain/repositories/CourseRepository";
import type { CourseDetail } from "../../domain/entities/courseDetail";
import { getJson } from "../../../../shared/infrastructure/http/apiClient";
import { buildCourseByIdPath } from "../../../../shared/infrastructure/http/apiPaths";

type ApiCourseDetail = {
  id?: unknown;
  name?: unknown;
  code?: unknown;
  cycle?: unknown;
  credits?: unknown;
  prerequisite?: unknown;
};

const toCourseDetail = (payload: ApiCourseDetail | null | undefined, fallbackId: string): CourseDetail => {
  const id = typeof payload?.id === "string" ? payload.id : fallbackId;
  const name = typeof payload?.name === "string" ? payload.name : "";
  const code = typeof payload?.code === "string" ? payload.code : id;
  const cycle = typeof payload?.cycle === "number" ? payload.cycle : Number(payload?.cycle ?? 0);
  const credits = typeof payload?.credits === "number" ? payload.credits : Number(payload?.credits ?? 0);
  const prereq = Array.isArray(payload?.prerequisite)
    ? (payload?.prerequisite as unknown[]).filter((p): p is string => typeof p === "string")
    : [];
  return {
    id,
    name,
    code,
    cycle: Number.isFinite(cycle) ? cycle : 0,
    credits: Number.isFinite(credits) ? credits : 0,
    prerequisites: prereq,
  };
};

export const createCourseRepository = (): CourseRepository => {
  const getById: CourseRepository["getById"] = async (id: string) => {
    const path = buildCourseByIdPath(id);
    const resp = await getJson<ApiCourseDetail>(path);
    return toCourseDetail(resp, id);
  };

  return {
    getById,
  };
};
