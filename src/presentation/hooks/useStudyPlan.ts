import { useMemo } from "react";
import type { CreateStudyPlanRequest, CreateStudyPlanResponse, ListStudyPlansResponse, StudyPlanDetailResponse } from "@/domain/entities/coursePlan";
import { createStudyPlanRepository } from "@/infrastructure/repositories/StudyPlanRepositoryImpl";
import { createCreateStudyPlan } from "@/application/useCases/studyPlan/createStudyPlan";
import { useStudent } from "@/presentation/hooks/useStudent";
import { createListStudyPlans } from "@/application/useCases/studyPlan/listStudyPlans";
import { createGetStudyPlanDetail } from "@/application/useCases/studyPlan/getStudyPlanDetail";

interface UseStudyPlanApi {
  create(payload: CreateStudyPlanRequest): Promise<CreateStudyPlanResponse>;
  listMine(): Promise<ListStudyPlansResponse>;
  getDetail(planId: string): Promise<StudyPlanDetailResponse>;
  remove(planId: string): Promise<{ message: string }>;
}

export const useStudyPlan = (): UseStudyPlanApi => {
  const repository = useMemo(() => createStudyPlanRepository(), []);
  const { getProfile } = useStudent();

  const api = useMemo(() => {
    const createUc = createCreateStudyPlan(repository);
    const listUc = createListStudyPlans(repository);
    const detailUc = createGetStudyPlanDetail(repository);

    const create = async (payload: CreateStudyPlanRequest): Promise<CreateStudyPlanResponse> => {
      const profile = await getProfile();
      const studentId = profile.id || undefined;
      if (!studentId) throw new Error("No se pudo determinar el ID del estudiante");
      return createUc(studentId, payload);
    };

    const listMine = async (): Promise<ListStudyPlansResponse> => {
      const profile = await getProfile();
      const studentId = profile.id || undefined;
      if (!studentId) throw new Error("No se pudo determinar el ID del estudiante");
      return listUc(studentId);
    };

    const getDetail = async (planId: string): Promise<StudyPlanDetailResponse> => {
      return detailUc(planId);
    };

    const remove = async (planId: string): Promise<{ message: string }> => {
      return repository.delete(planId);
    };

    return { create, listMine, getDetail, remove } satisfies UseStudyPlanApi;
  }, [repository, getProfile]);

  return api;
};
