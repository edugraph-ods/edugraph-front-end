import type { PlanInput, PlanResult } from "@/features/shared/domain/entities/graph";
import type { GraphRepository } from "@/features/common/domain/repositories/GraphRepository";

export const createPlanGraph = (graphRepository: GraphRepository) => {
  return async (input: PlanInput): Promise<PlanResult> => {
    return graphRepository.plan(input);
  };
};
