import type { DetectCyclesResult } from "@/features/shared/domain/entities/graph";
import type { GraphRepository } from "@/features/common/domain/repositories/GraphRepository";

export const createDetectCycles = (graphRepository: GraphRepository) => {
  return async (): Promise<DetectCyclesResult> => {
    return graphRepository.detectCycles();
  };
};
