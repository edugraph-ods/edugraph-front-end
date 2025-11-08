import type { DetectCyclesResult } from "@/domain/entities/graph";
import type { GraphRepository } from "@/domain/repositories/GraphRepository";

export const createDetectCycles = (graphRepository: GraphRepository) => {
  return async (): Promise<DetectCyclesResult> => {
    return graphRepository.detectCycles();
  };
};
