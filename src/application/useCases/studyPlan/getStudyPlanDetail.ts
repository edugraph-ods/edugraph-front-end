import type { StudyPlanRepository } from "@/domain/repositories/StudyPlanRepository";
import type { StudyPlanDetailResponse } from "@/domain/entities/coursePlan";

export const createGetStudyPlanDetail = (repository: StudyPlanRepository) => {
  return async (planId: string): Promise<StudyPlanDetailResponse> => {
    return repository.getDetail(planId);
  };
};
