import type { Course } from "@/features/education/courses/domain/entities/course";

interface FilterByCycleParams {
  courses: Course[];
  cycle: number | null;
  showStudyPlanOnly?: boolean;
  plannedCourseIds?: string[];
}

interface ToggleCycleParams {
  expandedCycles: number[];
  cycle: number;
}

interface SelectCourseParams extends FilterByCycleParams {
  courseId: string;
  currentSelectedCourseId: string | null;
  currentSelectedCycle: number | null;
  expandedCycles: number[];
}

interface SelectCourseResult {
  selectedCourseId: string | null;
  selectedCycle: number | null;
  expandedCycles: number[];
  filteredCourses: Course[];
}

interface SelectCycleResult {
  selectedCycle: number | null;
  filteredCourses: Course[];
}

interface SelectCareerParams {
  currentCareer: string;
  nextCareer: string;
}

export interface DashboardFiltersFacade {
  filterByCycle(params: FilterByCycleParams): Course[];
  selectCycle(params: FilterByCycleParams): SelectCycleResult;
  toggleCycle(params: ToggleCycleParams): number[];
  selectCourse(params: SelectCourseParams): SelectCourseResult;
  statusColors: Record<"approved" | "failed" | "not_taken", string>;
  statusLabels: Record<"approved" | "failed" | "not_taken" | "all", string>;
  deriveCareers(courses: Course[]): Array<{ id: string; name: string }>;
  selectCareer(params: SelectCareerParams): string;
}

const dedupeAndSortCycles = (cycles: number[]): number[] => {
  return Array.from(new Set(cycles)).sort((a, b) => a - b);
};

const applyStudyPlanFilter = (
  courses: Course[],
  showStudyPlanOnly?: boolean,
  plannedCourseIds?: string[]
): Course[] => {
  if (!showStudyPlanOnly) {
    return courses;
  }

  const plannedSet = new Set(plannedCourseIds ?? []);

  return courses.filter((course) => course.isInStudyPlan || plannedSet.has(course.id));
};

export const createDashboardFiltersFacade = (): DashboardFiltersFacade => {
  const filterByCycle = ({
    courses,
    cycle,
    showStudyPlanOnly,
    plannedCourseIds,
  }: FilterByCycleParams): Course[] => {
    if (cycle === null || cycle === undefined) {
      return [];
    }

    const byCycle = courses.filter((course) => course.cycle === cycle);
    return applyStudyPlanFilter(byCycle, showStudyPlanOnly, plannedCourseIds);
  };

  const selectCycle = (params: FilterByCycleParams): SelectCycleResult => {
    const filteredCourses = filterByCycle(params);
    return {
      selectedCycle: params.cycle,
      filteredCourses,
    };
  };

  const toggleCycle = ({ expandedCycles, cycle }: ToggleCycleParams): number[] => {
    if (expandedCycles.includes(cycle)) {
      return dedupeAndSortCycles(expandedCycles.filter((value) => value !== cycle));
    }

    return dedupeAndSortCycles([...expandedCycles, cycle]);
  };

  const selectCourse = ({
    courses,
    courseId,
    currentSelectedCourseId,
    currentSelectedCycle,
    expandedCycles,
    showStudyPlanOnly,
    plannedCourseIds,
  }: SelectCourseParams): SelectCourseResult => {
    if (currentSelectedCourseId === courseId) {
      return {
        selectedCourseId: null,
        selectedCycle: null,
        expandedCycles,
        filteredCourses: [],
      };
    }

    const course = courses.find((item) => item.id === courseId);

    if (!course) {
      const fallbackFiltered =
        currentSelectedCycle !== null
          ? filterByCycle({
              courses,
              cycle: currentSelectedCycle,
              showStudyPlanOnly,
              plannedCourseIds,
            })
          : [];

      return {
        selectedCourseId: currentSelectedCourseId,
        selectedCycle: currentSelectedCycle,
        expandedCycles,
        filteredCourses: fallbackFiltered,
      };
    }

    const nextExpanded = expandedCycles.includes(course.cycle)
      ? expandedCycles
      : dedupeAndSortCycles([...expandedCycles, course.cycle]);

    const filteredCourses = filterByCycle({
      courses,
      cycle: course.cycle,
      showStudyPlanOnly,
      plannedCourseIds,
    });

    return {
      selectedCourseId: courseId,
      selectedCycle: course.cycle,
      expandedCycles: nextExpanded,
      filteredCourses,
    };
  };

  const statusColors = {
    approved: "bg-green-100 text-green-800 border-green-200",
    failed: "bg-red-100 text-red-800 border-red-200",
    not_taken: "bg-gray-100 text-gray-800 border-gray-200",
  } as const;

  const statusLabels = {
    approved: "Aprobados",
    failed: "Desaprobados",
    not_taken: "No rendidos",
    all: "Todos",
  } as const;

  const deriveCareers = (courses: Course[]) => {
    const values = new Set<string>();
    courses.forEach((course) => {
      if (course.career) {
        values.add(course.career);
      }
    });

    return Array.from(values)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ id: value, name: value }));
  };

  const selectCareer = ({ currentCareer, nextCareer }: SelectCareerParams) => {
    if (currentCareer === nextCareer) {
      return currentCareer;
    }

    return nextCareer;
  };

  return {
    filterByCycle,
    selectCycle,
    toggleCycle,
    selectCourse,
    statusColors,
    statusLabels,
    deriveCareers,
    selectCareer,
  } satisfies DashboardFiltersFacade;
};
