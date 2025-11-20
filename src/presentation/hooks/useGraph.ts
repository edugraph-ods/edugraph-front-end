import { useMemo } from "react";
import { createGraphRepository } from "@/infrastructure/repositories/GraphRepositoryImpl";
import { createIngestGraph } from "@/application/useCases/graph/ingestGraph";
import { createGetCourses } from "@/application/useCases/graph/getCourses";
import { createDetectCycles } from "@/application/useCases/graph/detectCycles";
import { createPlanGraph } from "@/application/useCases/graph/planGraph";
import { createGeneratePlan } from "@/application/useCases/dashboard/createGeneratePlan";
import type {
  DetectCyclesResult,
  GraphCourse,
  IngestInput,
  PlanInput,
  PlanResult,
} from "@/domain/entities/graph";
import type { Course } from "@/domain/entities/course";

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
