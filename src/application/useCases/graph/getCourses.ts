import type { GraphCourse } from "@/domain/entities/graph";
import type { GraphRepository } from "@/domain/repositories/GraphRepository";

export const createGetCourses = (graphRepository: GraphRepository) => {
  return async (): Promise<GraphCourse[]> => {
    return graphRepository.getCourses();
  };
};
