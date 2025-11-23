import type { CareerRepository } from "@/domain/repositories/CareerRepository";

export interface MinPrereqsResponse {
  course_id: string;
  min_courses_required: number;
  courses_in_order: Array<{ id: string; name: string; code: string }>;
}

export const createGetMinPrerequisites = (repo: CareerRepository) => {
  return async (careerId: string, courseId: string): Promise<MinPrereqsResponse> => {
    return repo.getMinPrerequisites(careerId, courseId);
  };
};
