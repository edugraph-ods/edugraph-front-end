import type { PlanInput, PlanResult } from "@/domain/entities/graph";
import type { GraphRepository } from "@/domain/repositories/GraphRepository";

export const createPlanGraph = (graphRepository: GraphRepository) => {
  return async (input: PlanInput): Promise<PlanResult> => {
    return graphRepository.plan(input);
  };
};
