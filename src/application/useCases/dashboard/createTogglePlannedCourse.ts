import type { Course } from "@/domain/entities/course";

interface TogglePlannedCourseInput {
  courses: Course[];
  plannedCourseIds: string[];
  courseId: string;
}

interface TogglePlannedCourseResult {
  plannedCourseIds: string[];
  error?: string;
}

const PREREQUISITES_ERROR_MESSAGE = (courseId: string) =>
  `Seleccione primero los prerrequisitos de ${courseId}`;

const COURSE_NOT_FOUND_MESSAGE = (courseId: string) =>
  `Curso no encontrado: ${courseId}`;

export const createTogglePlannedCourse = () => {
  return ({
    courses,
    plannedCourseIds,
    courseId,
  }: TogglePlannedCourseInput): TogglePlannedCourseResult => {
    const course = courses.find((item) => item.id === courseId);

    if (!course) {
      return {
        plannedCourseIds,
        error: COURSE_NOT_FOUND_MESSAGE(courseId),
      } satisfies TogglePlannedCourseResult;
    }

    const isAlreadyPlanned = plannedCourseIds.includes(courseId);

    if (isAlreadyPlanned) {
      return {
        plannedCourseIds: plannedCourseIds.filter((id) => id !== courseId),
      } satisfies TogglePlannedCourseResult;
    }

    const approvedCourses = new Set(
      courses.filter((item) => item.status === "approved").map((item) => item.id)
    );

    const prerequisites = course.prerequisites || [];
    const hasAllPrerequisites = prerequisites.every((prerequisiteId) =>
      approvedCourses.has(prerequisiteId)
    );

    if (!hasAllPrerequisites) {
      return {
        plannedCourseIds,
        error: PREREQUISITES_ERROR_MESSAGE(courseId),
      } satisfies TogglePlannedCourseResult;
    }

    return {
      plannedCourseIds: [...plannedCourseIds, courseId],
    } satisfies TogglePlannedCourseResult;
  };
};
