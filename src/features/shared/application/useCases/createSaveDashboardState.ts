import type { DashboardPreferencesRepository } from "@/features/shared/domain/repositories/DashboardPreferencesRepository";
import type { DashboardState } from "@/features/shared/domain/entities/dashboard";

export const createSaveDashboardState = (
  repository: DashboardPreferencesRepository
) => {
  return async (state: DashboardState): Promise<void> => {
    await repository.saveState(state);
  };
};
