import type { DashboardPreferencesRepository } from "../../domain/repositories/DashboardPreferencesRepository";
import type { DashboardState } from "../../domain/entities/dashboard";

const STORAGE_KEY = "edugraph-dashboard-state";

const defaultState: DashboardState = {
  statuses: {},
  plannedCourseIds: [],
  selectedCareer: null,
  creditLimit: null,
};

const readFromStorage = (): DashboardState => {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultState;
    }
    const parsed = JSON.parse(raw) as Partial<DashboardState>;
    return {
      statuses: parsed.statuses ?? {},
      plannedCourseIds: Array.isArray(parsed.plannedCourseIds)
        ? parsed.plannedCourseIds.filter((id): id is string => typeof id === "string")
        : [],
      selectedCareer:
        typeof parsed.selectedCareer === "string" ? parsed.selectedCareer : null,
      creditLimit:
        typeof parsed.creditLimit === "number" && Number.isFinite(parsed.creditLimit)
          ? parsed.creditLimit
          : null,
    } satisfies DashboardState;
  } catch (error) {
    console.warn("Failed to parse dashboard preferences", error);
    return defaultState;
  }
};

const writeToStorage = (state: DashboardState) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: DashboardState = {
      statuses: state.statuses ?? {},
      plannedCourseIds: Array.isArray(state.plannedCourseIds)
        ? state.plannedCourseIds.filter((id): id is string => typeof id === "string")
        : [],
      selectedCareer:
        typeof state.selectedCareer === "string" ? state.selectedCareer : null,
      creditLimit:
        typeof state.creditLimit === "number" && Number.isFinite(state.creditLimit)
          ? state.creditLimit
          : null,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to persist dashboard preferences", error);
  }
};

const clearStorage = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear dashboard preferences", error);
  }
};

export const createDashboardPreferencesRepository = (): DashboardPreferencesRepository => {
  const getState: DashboardPreferencesRepository["getState"] = async () => {
    return readFromStorage();
  };

  const saveState: DashboardPreferencesRepository["saveState"] = async (state) => {
    writeToStorage(state ?? defaultState);
  };

  const clearState: DashboardPreferencesRepository["clearState"] = async () => {
    clearStorage();
  };

  return {
    getState,
    saveState,
    clearState,
  };
};
