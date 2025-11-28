import type { CreateStudyPlanRequest, CreateStudyPlanResponse, ListStudyPlansResponse, StudyPlanDetailResponse } from "@/domain/entities/coursePlan";

export interface StudyPlanRepository {
  create(studentId: string, payload: CreateStudyPlanRequest): Promise<CreateStudyPlanResponse>;
  listByStudent(studentId: string): Promise<ListStudyPlansResponse>;
  getDetail(planId: string): Promise<StudyPlanDetailResponse>;
  delete(planId: string): Promise<{ message: string }>;
}
