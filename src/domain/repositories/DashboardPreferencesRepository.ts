import type { DashboardState } from "@/domain/entities/dashboard";

export interface DashboardPreferencesRepository {
  getState(): Promise<DashboardState>;
  saveState(state: DashboardState): Promise<void>;
  clearState(): Promise<void>;
}
