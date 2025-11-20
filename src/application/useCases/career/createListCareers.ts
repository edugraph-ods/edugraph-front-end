import type { Career } from "@/domain/entities/career";
import type { CareerRepository } from "@/domain/repositories/CareerRepository";

export const createListCareers = (repo: CareerRepository) => {
  return async (): Promise<Career[]> => {
    const careers = await repo.listCareers();
    return careers;
  };
};
