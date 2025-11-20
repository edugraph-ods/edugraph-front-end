import type {
  GraphCourse,
  IngestInput,
} from "@/domain/entities/graph";
import type { GraphRepository } from "@/domain/repositories/GraphRepository";

export const createIngestGraph = (graphRepository: GraphRepository) => {
  return async (input: IngestInput): Promise<GraphCourse[]> => {
    return graphRepository.ingest(input);
  };
};
