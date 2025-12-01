import type { Course } from "@/features/education/courses/domain/entities/course";
import type { CourseGraphResult } from "@/features/education/courses/domain/entities/coursePlan";
import {
  CourseGraphBuilder,
  type BuildCourseGraphOptions,
} from "@/features/education/courses/domain/services/CourseGraphBuilder";

export type BuildCourseGraph = (
  courses: Course[],
  options?: BuildCourseGraphOptions
) => CourseGraphResult;

interface Dependencies {
  builder?: CourseGraphBuilder;
}

export const createBuildCourseGraph = (
  dependencies: Dependencies = {}
): BuildCourseGraph => {
  const builder = dependencies.builder ?? new CourseGraphBuilder();

  return (courses, options) => builder.build(courses, options);
};
