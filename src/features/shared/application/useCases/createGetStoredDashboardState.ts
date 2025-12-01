import type { DashboardPreferencesRepository } from "@/features/shared/domain/repositories/DashboardPreferencesRepository";
import type { DashboardState } from "@/features/shared/domain/entities/dashboard";

export const createGetStoredDashboardState = (
  repository: DashboardPreferencesRepository
) => {
  return async (): Promise<DashboardState> => {
    return repository.getState();
  };
};
