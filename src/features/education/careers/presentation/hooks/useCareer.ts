import { useMemo } from "react";
import { createCareerRepository } from "../../infrastructure/repositories/CareerRepositoryImpl";
import { createListCareers } from "../../application/useCases/createListCareers";
import { createListCoursesByCareer } from "../../application/useCases/createListCoursesByCareer";
import { createGetMinPrerequisites } from "../../../academic_progress/application/useCases/createGetMinPrerequisites";
import { createCalculateAcademicProgress } from "../../../academic_progress/application/useCases/createCalculateAcademicProgress";
import type { Career } from "../../domain/entities/career";
import type { Course } from "../../../courses/domain/entities/course";
import type { AcademicProgressRequest, AcademicProgressResponse } from "../../../academic_progress/domain/entities/progress";

interface UseCareerApi {
  listCareers(): Promise<Career[]>;
  listCoursesByCareer(careerId: string): Promise<Course[]>;
  calculateAcademicProgress(careerId: string, payload: AcademicProgressRequest): Promise<AcademicProgressResponse>;
  getMinPrerequisites(careerId: string, courseId: string): ReturnType<ReturnType<typeof createGetMinPrerequisites>>;
}

export const useCareer = (): UseCareerApi => {
  const repository = useMemo(() => createCareerRepository(), []);

  const api = useMemo(() => {
    const listCareers = createListCareers(repository);
    const listCoursesByCareer = createListCoursesByCareer(repository);
    const calculateAcademicProgress = createCalculateAcademicProgress(repository);
    const getMinPrerequisites = createGetMinPrerequisites(repository);
    return { listCareers, listCoursesByCareer, calculateAcademicProgress, getMinPrerequisites } satisfies UseCareerApi;
  }, [repository]);

  return api;
};
