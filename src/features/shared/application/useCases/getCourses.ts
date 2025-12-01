import type { GraphCourse } from "@/features/shared/domain/entities/graph";
import type { GraphRepository } from "@/features/common/domain/repositories/GraphRepository";

export const createGetCourses = (graphRepository: GraphRepository) => {
  return async (): Promise<GraphCourse[]> => {
    return graphRepository.getCourses();
  };
};
