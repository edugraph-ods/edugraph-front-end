import type { DashboardPreferencesRepository } from "@/domain/repositories/DashboardPreferencesRepository";
import type { DashboardState } from "@/domain/entities/dashboard";

export const createGetStoredDashboardState = (
  repository: DashboardPreferencesRepository
) => {
  return async (): Promise<DashboardState> => {
    return repository.getState();
  };
};
