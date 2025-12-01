import type { Career } from "@/features/education/careers/domain/entities/career";
import type { CareerRepository } from "@/features/education/careers/domain/repositories/CareerRepository";

export const createListCareers = (repo: CareerRepository) => {
  return async (): Promise<Career[]> => {
    const careers = await repo.listCareers();
    return careers;
  };
};
