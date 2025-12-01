import type { StudyPlanRepository } from "../../domain/repositories/StudyPlanRepository";
import type { CreateStudyPlanRequest, CreateStudyPlanResponse } from "../../domain/entities/coursePlan";

export const createCreateStudyPlan = (repository: StudyPlanRepository) => {
  return async (studentId: string, payload: CreateStudyPlanRequest): Promise<CreateStudyPlanResponse> => {
    return repository.create(studentId, payload);
  };
};
