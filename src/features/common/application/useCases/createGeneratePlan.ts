import type { Course } from "@/features/education/courses/domain/entities/course";
import type { PlanInput, PlanResult } from "@/features/shared/domain/entities/graph";
import type { GraphRepository } from "@/features/common/domain/repositories/GraphRepository";

export interface GeneratePlanInput {
  courses: Course[];
  plannedCourseIds: string[];
  creditLimit: number | null;
  algorithm?: string;
}

export type GeneratePlan = (input: GeneratePlanInput) => Promise<PlanResult>;

export const createGeneratePlan = (
  repository: GraphRepository
): GeneratePlan => {
  return async ({ courses, plannedCourseIds, creditLimit, algorithm }) => {
    if (typeof creditLimit !== "number" || creditLimit <= 0) {
      throw new Error("Ingrese un límite de créditos válido");
    }

    const approved = courses
      .filter((course) => course.status === "approved")
      .map((course) => course.id);

    const failures = courses.reduce<Record<number, string[]>>((acc, course) => {
      if (course.status === "failed") {
        const key = course.cycle;
        acc[key] = acc[key] ? [...acc[key], course.id] : [course.id];
      }
      return acc;
    }, {});

    const payload: PlanInput = {
      maxCredits: creditLimit,
      approved,
      targetCodes: plannedCourseIds.length ? plannedCourseIds : undefined,
      failures: Object.keys(failures).length ? failures : undefined,
      algorithm,
    };

    return repository.plan(payload);
  };
};
