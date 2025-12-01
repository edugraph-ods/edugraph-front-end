import { useMemo } from "react";
import { createGraphRepository } from "@/features/shared/infrastructure/repositories/GraphRepositoryImpl";
import { createIngestGraph } from "@/features/shared/application/useCases/ingestGraph";
import { createGetCourses } from "@/features/shared/application/useCases/getCourses";
import { createDetectCycles } from "@/features/shared/application/useCases/detectCycles";
import { createPlanGraph } from "@/features/shared/application/useCases/planGraph";
import { createGeneratePlan } from "@/features/common/application/useCases/createGeneratePlan";
import type {
  DetectCyclesResult,
  GraphCourse,
  IngestInput,
  PlanInput,
  PlanResult,
} from "../../../shared/domain/entities/graph";
import type { Course } from "../../../education/courses/domain/entities/course";

interface UseGraphApi {
  ingest(input: IngestInput): Promise<GraphCourse[]>;
  getCourses(): Promise<GraphCourse[]>;
  detectCycles(): Promise<DetectCyclesResult>;
  plan(input: PlanInput): Promise<PlanResult>;
  generatePlan(input: {
    courses: Course[];
    plannedCourseIds: string[];
    creditLimit: number | null;
    algorithm?: string;
  }): Promise<PlanResult>;
}

export const useGraph = (): UseGraphApi => {
  const repository = useMemo(() => createGraphRepository(), []);

  const api = useMemo(() => {
    const ingest = createIngestGraph(repository);
    const getCourses = createGetCourses(repository);
    const detectCycles = createDetectCycles(repository);
    const plan = createPlanGraph(repository);
    const generatePlan = createGeneratePlan(repository);

    return { ingest, getCourses, detectCycles, plan, generatePlan } satisfies UseGraphApi;
  }, [repository]);

  return api;
};
