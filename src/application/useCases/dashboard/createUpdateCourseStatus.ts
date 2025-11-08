import type { Course, CourseStatus } from "@/domain/entities/course";
import {
  CoursePlanner,
  SchedulingError,
  type CoursePlannerOptions,
} from "@/domain/services/CoursePlanner";

interface UpdateCourseStatusInput {
  courses: Course[];
  courseId: string;
  status: CourseStatus;
  plannerOptions?: CoursePlannerOptions;
}

interface UpdateCourseStatusResult {
  courses: Course[];
  criticalPath: string[];
  error?: string;
}

const DEFAULT_ERROR_MESSAGE =
  "No se pudo actualizar el estado del curso. Inténtalo nuevamente.";

export const createUpdateCourseStatus = () => {
  return ({
    courses,
    courseId,
    status,
    plannerOptions,
  }: UpdateCourseStatusInput): UpdateCourseStatusResult => {
    try {
      const planner = new CoursePlanner(courses, plannerOptions);
      planner.updateCourseStatus(courseId, status);

      return {
        courses: planner.getCourses(),
        criticalPath: planner.getCriticalPath(),
      } satisfies UpdateCourseStatusResult;
    } catch (error) {
      if (error instanceof SchedulingError) {
        return {
          courses,
          criticalPath: [],
          error: error.message,
        } satisfies UpdateCourseStatusResult;
      }

      console.error("updateCourseStatus use case error", error);

      return {
        courses,
        criticalPath: [],
        error: DEFAULT_ERROR_MESSAGE,
      } satisfies UpdateCourseStatusResult;
    }
  };
};
