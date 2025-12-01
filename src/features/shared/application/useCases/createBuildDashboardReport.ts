import type { Course } from "../../../education/courses/domain/entities/course";
import type { PlanResult } from "../../domain/entities/graph";
import type { AcademicProgressResponse } from "../../../education/academic_progress/domain/entities/progress";
import type {
  DashboardReport,
  DashboardReportCourse,
  DashboardReportLabels,
  DashboardReportPlanCycle,
  DashboardReportProgressEstimate,
} from "../../domain/entities/dashboardReport";

export interface BuildDashboardReportInput {
  universityName?: string;
  careerName?: string;
  creditLimit?: number | null;
  totalPlannedCredits: number;
  courses: Course[];
  plannedCourseIds: string[];
  planResult?: PlanResult | null;
  progressEstimate?: AcademicProgressResponse | null;
  labels?: DashboardReportLabels;
}

const createStatusTotals = (courses: DashboardReportCourse[]): DashboardReport["statusTotals"] => {
  return courses.reduce((acc, course) => {
    acc[course.status] = (acc[course.status] ?? 0) + 1;
    return acc;
  }, { approved: 0, failed: 0, not_taken: 0 });
};

const createPlanSection = (
  planResult: PlanResult | null | undefined,
  courseById: Map<string, Course>
): DashboardReport["plan"] => {
  if (!planResult) {
    return undefined;
  }

  const cycles: DashboardReportPlanCycle[] = planResult.cycles.map((cycle) => ({
    cycle: cycle.cycle,
    totalCredits: cycle.totalCredits,
    courses: cycle.courses.map((courseId) => ({
      id: courseId,
      name: courseById.get(courseId)?.name,
    })),
  }));

  return {
    totalCycles: planResult.totalCycles,
    cycles,
  };
};

const mapProgressEstimate = (
  progress: AcademicProgressResponse | null | undefined
): DashboardReportProgressEstimate | undefined => {
  if (!progress) {
    return undefined;
  }

  return {
    cyclesNeeded: progress.cycles_needed_to_graduate,
    monthsNeeded: progress.months_needed_to_graduate,
    yearsNeeded: progress.years_needed_to_graduate,
  };
};

const toReportCourses = (
  courses: Course[],
  plannedIds: Set<string>
): DashboardReportCourse[] => {
  return courses.map((course) => ({
    id: course.id,
    name: course.name,
    credits: course.credits,
    cycle: course.cycle,
    status: course.status,
    isPlanned: plannedIds.has(course.id),
  }));
};

export const createBuildDashboardReport = () => {
  return ({
    universityName,
    careerName,
    creditLimit,
    totalPlannedCredits,
    courses,
    plannedCourseIds,
    planResult,
    progressEstimate,
    labels,
  }: BuildDashboardReportInput): DashboardReport => {
    const plannedSet = new Set(plannedCourseIds);
    const reportCourses = toReportCourses(courses, plannedSet);
    const plannedCourses = reportCourses.filter((course) => course.isPlanned);
    const courseById = new Map(courses.map((course) => [course.id, course] as const));

    return {
      generatedAt: new Date().toISOString(),
      universityName,
      careerName,
      creditLimit,
      totalPlannedCredits,
      courses: reportCourses,
      plannedCourses,
      statusTotals: createStatusTotals(reportCourses),
      plan: createPlanSection(planResult, courseById),
      progressEstimate: mapProgressEstimate(progressEstimate),
      labels,
    } satisfies DashboardReport;
  };
};
