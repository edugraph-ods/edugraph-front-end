import type { StudyPlanRepository } from "@/domain/repositories/StudyPlanRepository";
import type { CreateStudyPlanRequest, ListStudyPlansResponse, StudyPlanDetailResponse } from "@/domain/entities/coursePlan";
import { createStudyPlan, getJson, deleteJson } from "@/infrastructure/http/apiClient";
import { buildStudentStudyPlansPath, buildStudyPlanDetailPath, buildStudyPlanDeletePath } from "@/infrastructure/http/apiPaths";

export const createStudyPlanRepository = (): StudyPlanRepository => {
  const create: StudyPlanRepository["create"] = async (studentId: string, payload: CreateStudyPlanRequest) => {
    return await createStudyPlan(studentId, payload);
  };

  const listByStudent: StudyPlanRepository["listByStudent"] = async (studentId: string) => {
    const path = buildStudentStudyPlansPath(studentId);
    return await getJson<ListStudyPlansResponse>(path);
  };

  const getDetail: StudyPlanRepository["getDetail"] = async (planId: string) => {
    const path = buildStudyPlanDetailPath(planId);
    return await getJson<StudyPlanDetailResponse>(path);
  };

  const remove: StudyPlanRepository["delete"] = async (planId: string) => {
    const path = buildStudyPlanDeletePath(planId);
    return await deleteJson<{ message: string }>(path);
  };

  return {
    create,
    listByStudent,
    getDetail,
    delete: remove,
  };
};
