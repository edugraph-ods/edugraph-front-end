import type { Course, CourseStatus } from "../../../education/courses/domain/entities/course";
import { createUpdateCourseStatus } from "./createUpdateCourseStatus";

interface ToggleCourseStatusInput {
  courses: Course[];
  courseId: string;
  currentStatus: CourseStatus;
}

interface ToggleCourseStatusResult {
  courses: Course[];
  error?: string;
}

const STATUS_MAP: Record<CourseStatus, CourseStatus> = {
  not_taken: "approved",
  approved: "failed",
  failed: "not_taken",
};

export const createToggleCourseStatus = () => {
  const updateCourseStatus = createUpdateCourseStatus();

  return ({ courses, courseId, currentStatus }: ToggleCourseStatusInput): ToggleCourseStatusResult => {
    const nextStatus = STATUS_MAP[currentStatus];
    return updateCourseStatus({ courses, courseId, status: nextStatus });
  };
};
