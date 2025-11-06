import { Course } from "../hooks/use-course";

export class SchedulingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "SchedulingError";
  }
}

type CourseState = {
  approved: number;
  failed: number;
  currentCycle: number;
};

type ScheduleStep = {
  cycle: number;
  courses: string[];
  credits: number;
  statuses: { [key: string]: "approved" | "failed" };
};

type ScheduleResult = {
  cycles: number;
  schedule: ScheduleStep[];
};

export class OptimizedCourseScheduler {
  private courses: Map<string, Course>;
  private courseIds: string[];
  private courseIndices: Map<string, number>;
  private prerequisites: Map<string, string[]>;
  private maxCreditsPerCycle: number;
  private memo: Map<string, ScheduleResult>;
  private topologicalOrder: string[];
  private combinationCache: Map<string, string[][]>;
  private criticalPath: string[] = [];

  constructor(courses: Course[], maxCreditsPerCycle: number) {
    if (!Array.isArray(courses)) {
      throw new Error("Courses must be an array");
    }

    const validCourses = courses.filter((course) => {
      const isValid =
        course &&
        typeof course === "object" &&
        "id" in course &&
        "prerequisites" in course;

      if (!isValid) {
        console.warn("Invalid course data found and will be skipped:", course);
      }
      return isValid;
    });

    if (validCourses.length === 0 && courses.length > 0) {
      console.error("No valid courses provided to OptimizedCourseScheduler");
    }

    this.courses = new Map(validCourses.map((c) => [c.id, c]));
    this.courseIds = validCourses.map((c) => c.id);
    this.courseIndices = new Map(validCourses.map((c, i) => [c.id, i]));

    const sanitizedPrereqs = new Map<string, string[]>();
    validCourses.forEach((course) => {
      const seen = new Set<string>();
      const sanitized: string[] = [];
      const rawPrereqs = Array.isArray(course.prerequisites)
        ? course.prerequisites
        : [];

      rawPrereqs.forEach((raw) => {
        let prereqId = "";
        if (typeof raw === "string") {
          prereqId = raw.trim();
        } else if (raw && typeof raw === "object") {
          if ("code" in raw && typeof (raw as any).code === "string") {
            prereqId = (raw as any).code.trim();
          } else if ("id" in raw && typeof (raw as any).id === "string") {
            prereqId = (raw as any).id.trim();
          } else if ("name" in raw && typeof (raw as any).name === "string") {
            prereqId = (raw as any).name.trim();
          }
        }
        if (!prereqId) return;

        const normalized = prereqId.toLowerCase();
        const canonicalId = this.courseIds.find(
          (id) => id.toLowerCase() === normalized
        );
        if (!canonicalId) {
          console.warn(
            `Se eliminó el prerrequisito desconocido ${prereqId} del curso ${course.id}`
          );
          return;
        }

        if (canonicalId === course.id) {
          console.warn(
            `Se eliminó el prerrequisito circular ${canonicalId} del curso ${course.id}`
          );
          return;
        }

        if (seen.has(canonicalId)) return;
        seen.add(canonicalId);
        sanitized.push(canonicalId);
      });

      course.prerequisites = sanitized;
      sanitizedPrereqs.set(course.id, sanitized);
    });

    this.prerequisites = sanitizedPrereqs;
    this.maxCreditsPerCycle = maxCreditsPerCycle;
    this.memo = new Map();
    this.combinationCache = new Map();

    try {
      this.topologicalOrder = this.calculateTopologicalOrder();
      this.calculateCriticalPath();
    } catch (error) {
      console.error("Error initializing course scheduler:", error);
      this.topologicalOrder = [];
      this.criticalPath = [];
    }
  }

  private calculateTopologicalOrder(): string[] {
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();

    this.courseIds.forEach((id) => {
      inDegree.set(id, 0);
      graph.set(id, []);
    });

    this.courseIds.forEach((id) => {
      const prereqs = this.prerequisites.get(id) || [];
      prereqs.forEach((p) => {
        if (!graph.has(p)) graph.set(p, []);
        graph.get(p)!.push(id);
        inDegree.set(id, (inDegree.get(id) || 0) + 1);
      });
    });

    const order: string[] = [];
    const queue: string[] = [];
    inDegree.forEach((deg, id) => {
      if (deg === 0) queue.push(id);
    });

    while (queue.length) {
      const u = queue.shift()!;
      order.push(u);
      for (const v of graph.get(u) || []) {
        const nd = (inDegree.get(v) || 0) - 1;
        inDegree.set(v, nd);
        if (nd === 0) queue.push(v);
      }
    }

    if (order.length === this.courseIds.length) {
      return order;
    }

    const remaining = new Set<string>(
      this.courseIds.filter((id) => (inDegree.get(id) || 0) > 0)
    );

    const cycles: string[][] = [];
    const visited = new Set<string>();
    const onStack = new Set<string>();
    const stack: string[] = [];

    const dfs = (u: string) => {
      visited.add(u);
      onStack.add(u);
      stack.push(u);

      for (const v of graph.get(u) || []) {
        if (!remaining.has(v)) continue;
        if (!visited.has(v)) {
          dfs(v);
        } else if (onStack.has(v)) {
          const idx = stack.lastIndexOf(v);
          if (idx !== -1) {
            const cyclePath = stack.slice(idx);
            cycles.push([...cyclePath]);
          }
        }
      }

      stack.pop();
      onStack.delete(u);
    };

    for (const id of remaining) {
      if (!visited.has(id)) dfs(id);
    }

    const seen = new Set<string>();
    const uniqueCycles = cycles
      .map((cyc) => {
        const n = cyc.length;
        if (n === 0) return cyc;
        let best = [...cyc];
        let bestKey = best.join("|");
        for (let i = 1; i < n; i++) {
          const rotated = [...cyc.slice(i), ...cyc.slice(0, i)];
          const key = rotated.join("|");
          if (key < bestKey) {
            best = rotated;
            bestKey = key;
          }
        }
        return best;
      })
      .filter((cyc) => {
        const key = cyc.join("->");
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const cycleMessages = uniqueCycles.length
      ? uniqueCycles
          .map((cycle, i) => {
            const isTruncated = cycle.length > 25;
            const display = isTruncated ? [...cycle.slice(0, 25), "..."] : cycle;
            const base = display.join(" -> ");
            const closure = !isTruncated && cycle.length > 0 ? ` -> ${cycle[0]}` : "";
            return `Ciclo ${i + 1}: ${base}${closure}`;
          })
          .join("\n")
      : "No se pudo determinar un ciclo simple, pero existe un ciclo en el grafo.";

    console.warn(
      `Se detectaron ciclos en los prerrequisitos. Se continuará con un orden parcial.\n${cycleMessages}`
    );

    const remainingList = Array.from(remaining);
    const completed = new Set(order);
    for (const id of remainingList) {
      if (!completed.has(id)) order.push(id);
    }
    return order;
  }

  private calculateCriticalPath() {
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();
    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const credits = new Map<string, number>();

    this.courseIds.forEach((id) => {
      const course = this.courses.get(id)!;
      inDegree.set(id, 0);
      graph.set(id, []);
      distances.set(id, 0);
      previous.set(id, "");
      credits.set(id, course.credits);
    });

    this.courseIds.forEach((id) => {
      const course = this.courses.get(id)!;
      course.prerequisites.forEach((prereqId) => {
        const prereq = this.courses.get(prereqId);
        if (prereq) {
          graph.get(prereqId)?.push(id);
          inDegree.set(id, (inDegree.get(id) || 0) + 1);
        }
      });
    });

    const queue: string[] = [];
    inDegree.forEach((degree, id) => {
      if (degree === 0) {
        queue.push(id);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const currentDistance = distances.get(current)!;
      const currentCredits = credits.get(current)!;

      for (const neighbor of graph.get(current) || []) {
        const creditWeight = currentCredits / 4;
        const newDistance = currentDistance + 1 + creditWeight;

        if (newDistance > (distances.get(neighbor) || 0)) {
          distances.set(neighbor, newDistance);
          previous.set(neighbor, current);
        }

        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
        if (inDegree.get(neighbor) === 0) {
          queue.push(neighbor);
        }
      }
    }

    let maxDistance = -1;
    let lastCourse = "";
    distances.forEach((distance, id) => {
      if (distance > maxDistance) {
        maxDistance = distance;
        lastCourse = id;
      }
    });

    const path: string[] = [];
    let current = lastCourse;
    while (current) {
      path.unshift(current);
      current = previous.get(current) || "";
    }

    this.criticalPath = path;
  }

  private isCourseInMask(mask: number, courseId: string): boolean {
    const index = this.courseIndices.get(courseId);
    return index !== undefined ? (mask & (1 << index)) !== 0 : false;
  }

  private addCourseToMask(mask: number, courseId: string): number {
    const index = this.courseIndices.get(courseId);
    return index !== undefined ? mask | (1 << index) : mask;
  }

  private getAvailableCourses(approved: number, failed: number): string[] {
    return this.topologicalOrder.filter((courseId) => {
      if (this.isCourseInMask(approved | failed, courseId)) return false;
      const prereqs = this.prerequisites.get(courseId) || [];
      return prereqs.every((prereqId) =>
        this.isCourseInMask(approved, prereqId)
      );
    });
  }
  private generateValidCombinations(availableCourses: string[]): string[][] {
    const key = [...availableCourses].sort().join(",");

    if (this.combinationCache.has(key)) {
      return this.combinationCache.get(key)!;
    }

    const combinations: string[][] = [];
    const n = availableCourses.length;

    for (let mask = 1; mask < 1 << n; mask++) {
      const current: string[] = [];
      let totalCredits = 0;
      let isValid = true;

      for (let i = 0; i < n && isValid; i++) {
        if (mask & (1 << i)) {
          const courseId = availableCourses[i];
          const course = this.courses.get(courseId);

          if (!course) {
            isValid = false;
            break;
          }

          totalCredits += course.credits;
          if (totalCredits > this.maxCreditsPerCycle) {
            isValid = false;
            break;
          }

          current.push(courseId);
        }
      }

      if (isValid && current.length > 0) {
        combinations.push(current);
      }
    }

    combinations.sort((a, b) => {
      const creditsA = a.reduce(
        (sum, id) => sum + (this.courses.get(id)?.credits || 0),
        0
      );
      const creditsB = b.reduce(
        (sum, id) => sum + (this.courses.get(id)?.credits || 0),
        0
      );
      return creditsB - creditsA;
    });

    this.combinationCache.set(key, combinations);
    return combinations;
  }
  public getOptimalSchedule(): ScheduleResult {
    try {
      const initialState: CourseState = {
        approved: 0,
        failed: 0,
        currentCycle: 1,
      };

      const result = this.dp(initialState);

      if (result.cycles === Infinity) {
        throw new SchedulingError(
          "No se pudo encontrar un horario válido con los parámetros dados.",
          "NO_VALID_SCHEDULE"
        );
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new SchedulingError(
          `Error al calcular el horario: ${error.message}`,
          "SCHEDULING_ERROR"
        );
      }
      throw error;
    }
  }

  public getCriticalPath(): string[] {
    return [...this.criticalPath];
  }

  public updateCourseStatus(
    courseId: string,
    status: "approved" | "failed" | "not_taken"
  ): void {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new SchedulingError(
        `Curso no encontrado: ${courseId}`,
        "COURSE_NOT_FOUND"
      );
    }

    if (course.status === status) return;

    if (status === "approved") {
      const missingPrereqs = (course.prerequisites || []).filter(
        (prereqId) => this.courses.get(prereqId)?.status !== "approved"
      );

      if (missingPrereqs.length > 0) {
        throw new SchedulingError(
          `No se puede aprobar ${courseId} sin completar los prerrequisitos: ${missingPrereqs.join(
            ", "
          )}`,
          "MISSING_PREREQUISITES"
        );
      }
    }

    course.status = status;
    this.memo.clear();
    this.combinationCache.clear();
    this.topologicalOrder = this.calculateTopologicalOrder();
    this.calculateCriticalPath();
  }

  private dp(state: CourseState): ScheduleResult {
    const key = `${state.approved},${state.failed},${state.currentCycle}`;

    if (this.memo.has(key)) {
      return this.memo.get(key)!;
    }

    const availableCourses = this.getAvailableCourses(
      state.approved,
      state.failed
    );

    if (
      availableCourses.length === 0 &&
      state.approved === (1 << this.courseIds.length) - 1
    ) {
      return { cycles: 0, schedule: [] };
    }

    if (availableCourses.length === 0) {
      return { cycles: Infinity, schedule: [] };
    }

    const combinations = this.generateValidCombinations(availableCourses);
    let minCycles = Infinity;
    let bestSchedule: ScheduleStep[] = [];

    for (const combination of combinations) {
      const credits = combination.reduce((sum, courseId) => {
        return sum + (this.courses.get(courseId)?.credits || 0);
      }, 0);

      const processOutcome = (
        outcome: number,
        index: number,
        currentApproved: number,
        currentFailed: number,
        currentStatuses: { [key: string]: "approved" | "failed" }
      ): void => {
        if (index === combination.length) {
          const newState: CourseState = {
            approved: currentApproved,
            failed: currentFailed,
            currentCycle: state.currentCycle + 1,
          };

          const result = this.dp(newState);

          if (result.cycles + 1 < minCycles) {
            minCycles = result.cycles + 1;
            bestSchedule = [
              {
                cycle: state.currentCycle,
                courses: [...combination],
                credits,
                statuses: { ...currentStatuses },
              },
              ...result.schedule,
            ];
          }
          return;
        }

        const courseId = combination[index];

        if (outcome & (1 << index)) {
          const newApproved = this.addCourseToMask(currentApproved, courseId);
          processOutcome(outcome, index + 1, newApproved, currentFailed, {
            ...currentStatuses,
            [courseId]: "approved",
          });
        } else {
          const newFailed = this.addCourseToMask(currentFailed, courseId);
          processOutcome(outcome, index + 1, currentApproved, newFailed, {
            ...currentStatuses,
            [courseId]: "failed",
          });
        }
      };

      const maxOutcome = 1 << combination.length;
      for (let outcome = 0; outcome < maxOutcome; outcome++) {
        processOutcome(outcome, 0, state.approved, state.failed, {});
      }
    }

    if (minCycles === Infinity && availableCourses.length > 0) {
      if (availableCourses.length > 0) {
        const forcedCourse = availableCourses[0];
        const courseCredits = this.courses.get(forcedCourse)?.credits || 0;

        if (courseCredits <= this.maxCreditsPerCycle) {
          const newState: CourseState = {
            approved: state.approved,
            failed: this.addCourseToMask(state.failed, forcedCourse),
            currentCycle: state.currentCycle + 1,
          };

          const forcedResult = this.dp(newState);
          if (forcedResult.cycles + 1 < minCycles) {
            minCycles = forcedResult.cycles + 1;
            bestSchedule = [
              {
                cycle: state.currentCycle,
                courses: [forcedCourse],
                credits: courseCredits,
                statuses: { [forcedCourse]: "failed" },
              },
              ...forcedResult.schedule,
            ];
          }
        }
      }
    }

    const finalResult = { cycles: minCycles, schedule: bestSchedule };
    this.memo.set(key, finalResult);
    return finalResult;
  }

  public calculateOptimalSchedule(): ScheduleResult {
    const initialState: CourseState = {
      approved: 0,
      failed: 0,
      currentCycle: 1,
    };

    return this.dp(initialState);
  }
}
