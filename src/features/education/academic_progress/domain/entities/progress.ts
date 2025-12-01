export type BackendCourseStatus = "NOT_STARTED" | "PASSED" | "FAILED";

export interface ProgressCourseInput {
  id: string;
  name: string;
  credits: number;
  prereqs: string[];
  status: BackendCourseStatus;
}

export interface ProgressCycleInput {
  cycle: number;
  courses: ProgressCourseInput[];
}

export interface AcademicProgressRequest {
  max_credits: number;
  cycles: ProgressCycleInput[];
}

export interface AcademicProgressResponse {
  cycles_needed_to_graduate: number;
  months_needed_to_graduate: number;
  years_needed_to_graduate: number;
}
