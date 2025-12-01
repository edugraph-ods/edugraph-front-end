import type {
  GraphCourse,
  IngestInput,
} from "@/features/shared/domain/entities/graph";
import type { GraphRepository } from "@/features/common/domain/repositories/GraphRepository";

export const createIngestGraph = (graphRepository: GraphRepository) => {
  return async (input: IngestInput): Promise<GraphCourse[]> => {
    return graphRepository.ingest(input);
  };
};
