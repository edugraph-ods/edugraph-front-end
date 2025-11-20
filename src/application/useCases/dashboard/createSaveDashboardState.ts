import type { DashboardPreferencesRepository } from "@/domain/repositories/DashboardPreferencesRepository";
import type { DashboardState } from "@/domain/entities/dashboard";

export const createSaveDashboardState = (
  repository: DashboardPreferencesRepository
) => {
  return async (state: DashboardState): Promise<void> => {
    await repository.saveState(state);
  };
};
