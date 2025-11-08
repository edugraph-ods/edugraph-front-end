import type { DashboardPreferencesRepository } from "@/domain/repositories/DashboardPreferencesRepository";

export const createClearDashboardState = (
  repository: DashboardPreferencesRepository
) => {
  return async (): Promise<void> => {
    await repository.clearState();
  };
};
