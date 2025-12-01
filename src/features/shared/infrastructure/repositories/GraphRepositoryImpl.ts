import {
  type DetectCyclesResult,
  type GraphCourse,
  type IngestInput,
  type PlanInput,
  type PlanResult,
  type PlanCycle,
} from "../../domain/entities/graph";
import type { GraphRepository } from "../../../common/domain/repositories/GraphRepository";
import { getJson, postJson } from "../../infrastructure/http/apiClient";
import { withPrefix } from "../../infrastructure/http/apiPaths";

type ApiCourse = {
  code: string;
  name: string;
  credits: number;
  cycle: number;
  university?: string | null;
  career?: string | null;
  program?: string | null;
  prerequisites?: string[];
};

type ApiDetectCycles = {
  has_cycles?: boolean;
  cycles?: unknown;
};

type ApiPlanCycle = {
  cycle?: number;
  total_credits?: number;
  courses?: unknown;
};

type ApiPlanResponse = {
  total_cycles?: number;
  cycles?: unknown;
};

const ensureStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const mapCourse = (course: ApiCourse): GraphCourse => ({
  code: course.code,
  name: course.name,
  credits: course.credits,
  cycle: course.cycle,
  university: course.university ?? null,
  career: course.career ?? null,
  program: course.program ?? null,
  prerequisites: ensureStringArray(course.prerequisites),
});

const mapDetectCycles = (payload: ApiDetectCycles): DetectCyclesResult => ({
  hasCycles: Boolean(payload?.has_cycles),
  cycles: Array.isArray(payload?.cycles)
    ? payload.cycles.map(ensureStringArray)
    : [],
});

const mapPlanCycle = (cycle: ApiPlanCycle): PlanCycle => ({
  cycle: cycle?.cycle ?? 0,
  totalCredits: cycle?.total_credits ?? 0,
  courses: ensureStringArray(cycle?.courses),
});

const mapPlanResult = (payload: ApiPlanResponse): PlanResult => ({
  totalCycles: payload?.total_cycles ?? 0,
  cycles: Array.isArray(payload?.cycles)
    ? payload.cycles
        .filter((item): item is ApiPlanCycle => typeof item === "object" && item !== null)
        .map(mapPlanCycle)
    : [],
});

const toApiIngestPayload = (input: IngestInput) => ({
  source_path: input.sourcePath,
  university: input.university,
  career: input.career,
  program: input.program,
});

const toApiPlanPayload = (input: PlanInput) => ({
  max_credits: input.maxCredits,
  approved: input.approved,
  target_codes: input.targetCodes,
  failures: input.failures,
  algorithm: input.algorithm,
});

export const createGraphRepository = (): GraphRepository => {
  const ingest: GraphRepository["ingest"] = async (input) => {
    const response = await postJson<ApiCourse[]>(withPrefix("/graph/ingest"), toApiIngestPayload(input));
    return Array.isArray(response) ? response.map(mapCourse) : [];
  };

  const getCourses: GraphRepository["getCourses"] = async () => {
    const response = await getJson<ApiCourse[]>(withPrefix("/graph/courses"));
    return Array.isArray(response) ? response.map(mapCourse) : [];
  };

  const detectCycles: GraphRepository["detectCycles"] = async () => {
    const response = await getJson<ApiDetectCycles>(withPrefix("/graph/detect-cycles"));
    return mapDetectCycles(response);
  };

  const plan: GraphRepository["plan"] = async (input: PlanInput) => {
    const apiPayload = toApiPlanPayload(input);
    const response = await postJson<ApiPlanResponse>(withPrefix("/graph/plan"), apiPayload);
    return mapPlanResult(response);
  };

  return {
    ingest,
    getCourses,
    detectCycles,
    plan,
  };
};
