import type { Course } from "@/domain/entities/course";
import type { CourseGraphResult } from "@/domain/entities/coursePlan";
import {
  CourseGraphBuilder,
  type BuildCourseGraphOptions,
} from "@/domain/services/CourseGraphBuilder";

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
