import { useMemo } from "react";
import { createCareerRepository } from "@/infrastructure/repositories/CareerRepositoryImpl";
import { createListCareers } from "@/application/useCases/career/createListCareers";
import { createListCoursesByCareer } from "@/application/useCases/career/createListCoursesByCareer";
import { createCalculateAcademicProgress } from "@/application/useCases/career/createCalculateAcademicProgress";
import type { Career } from "@/domain/entities/career";
import type { Course } from "@/domain/entities/course";
import type { AcademicProgressRequest, AcademicProgressResponse } from "@/domain/entities/progress";

interface UseCareerApi {
  listCareers(): Promise<Career[]>;
  listCoursesByCareer(careerId: string): Promise<Course[]>;
  calculateAcademicProgress(careerId: string, payload: AcademicProgressRequest): Promise<AcademicProgressResponse>;
}

export const useCareer = (): UseCareerApi => {
  const repository = useMemo(() => createCareerRepository(), []);

  const api = useMemo(() => {
    const listCareers = createListCareers(repository);
    const listCoursesByCareer = createListCoursesByCareer(repository);
    const calculateAcademicProgress = createCalculateAcademicProgress(repository);
    return { listCareers, listCoursesByCareer, calculateAcademicProgress } satisfies UseCareerApi;
  }, [repository]);

  return api;
};
