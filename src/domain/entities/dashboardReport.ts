import type { CourseStatus } from "@/domain/entities/course";

export interface DashboardReportCourse {
  id: string;
  name: string;
  credits: number;
  cycle: number;
  status: CourseStatus;
  isPlanned: boolean;
}

export interface DashboardReportPlanCourse {
  id: string;
  name?: string;
}

export interface DashboardReportPlanCycle {
  cycle: number;
  totalCredits: number;
  courses: DashboardReportPlanCourse[];
}

export interface DashboardReportProgressEstimate {
  cyclesNeeded: number;
  monthsNeeded: number;
  yearsNeeded: number;
}

export interface DashboardReportLabels {
  title?: string;
  summaryTitle?: string;
  generatedAt?: string;
  university?: string;
  career?: string;
  creditLimit?: string;
  totalPlannedCredits?: string;
  statusTotalsTitle?: string;
  plannedCoursesTitle?: string;
  allCoursesTitle?: string;
  planTitle?: string;
  planCyclePrefix?: string;
  progressTitle?: string;
  progressCycles?: string;
  progressMonths?: string;
  progressYears?: string;
  plannedBadge?: string;
  notPlannedBadge?: string;
  columns?: {
    course?: string;
    credits?: string;
    cycle?: string;
    status?: string;
  };
  statusLabels?: Partial<Record<CourseStatus, string>>;
}

export interface DashboardReport {
  generatedAt: string;
  universityName?: string;
  careerName?: string;
  creditLimit?: number | null;
  totalPlannedCredits: number;
  courses: DashboardReportCourse[];
  plannedCourses: DashboardReportCourse[];
  statusTotals: Record<CourseStatus, number>;
  plan?: {
    totalCycles: number;
    cycles: DashboardReportPlanCycle[];
  };
  progressEstimate?: DashboardReportProgressEstimate;
  labels?: DashboardReportLabels;
}
