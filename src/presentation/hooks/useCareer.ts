import { useMemo } from "react";
import { createCareerRepository } from "@/infrastructure/repositories/CareerRepositoryImpl";
import { createListCareers } from "@/application/useCases/career/createListCareers";
import { createListCoursesByCareer } from "@/application/useCases/career/createListCoursesByCareer";
import type { Career } from "@/domain/entities/career";
import type { Course } from "@/domain/entities/course";

interface UseCareerApi {
  listCareers(): Promise<Career[]>;
  listCoursesByCareer(careerId: string): Promise<Course[]>;
}

export const useCareer = (): UseCareerApi => {
  const repository = useMemo(() => createCareerRepository(), []);

  const api = useMemo(() => {
    const listCareers = createListCareers(repository);
    const listCoursesByCareer = createListCoursesByCareer(repository);
    return { listCareers, listCoursesByCareer } satisfies UseCareerApi;
  }, [repository]);

  return api;
};
