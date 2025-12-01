import type { StudyPlanRepository } from "../../domain/repositories/StudyPlanRepository";
import type { ListStudyPlansResponse } from "../../domain/entities/coursePlan";

export const createListStudyPlans = (repository: StudyPlanRepository) => {
  return async (studentId: string): Promise<ListStudyPlansResponse> => {
    return repository.listByStudent(studentId);
  };
};
