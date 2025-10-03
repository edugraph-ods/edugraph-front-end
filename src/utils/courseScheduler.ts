import { Course, CourseStatus } from "../hooks/use-course";

export class SchedulingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'SchedulingError';
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
  statuses: { [key: string]: 'approved' | 'failed' };
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
      throw new Error('Courses must be an array');
    }

    // Filter out any invalid courses and log warnings
    const validCourses = courses.filter(course => {
      const isValid = course && 
                     typeof course === 'object' && 
                     'id' in course && 
                     'prerequisites' in course;
      
      if (!isValid) {
        console.warn('Invalid course data found and will be skipped:', course);
      }
      return isValid;
    });

    if (validCourses.length === 0 && courses.length > 0) {
      console.error('No valid courses provided to OptimizedCourseScheduler');
    }

    this.courses = new Map(validCourses.map(c => [c.id, c]));
    this.courseIds = validCourses.map(c => c.id);
    this.courseIndices = new Map(validCourses.map((c, i) => [c.id, i]));
    this.prerequisites = new Map(validCourses.map(c => [c.id, c.prerequisites || []]));
    this.maxCreditsPerCycle = maxCreditsPerCycle;
    this.memo = new Map();
    this.combinationCache = new Map();
    
    try {
      this.topologicalOrder = this.calculateTopologicalOrder();
      this.calculateCriticalPath();
    } catch (error) {
      console.error('Error initializing course scheduler:', error);
      this.topologicalOrder = [];
      this.criticalPath = [];
    }
  }

  private calculateTopologicalOrder(): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];
    
    const visit = (courseId: string): boolean => {
      if (temp.has(courseId)) return false; 
      if (visited.has(courseId)) return true;
      
      temp.add(courseId);
      
      const prereqs = this.prerequisites.get(courseId) || [];
      for (const prereq of prereqs) {
        if (!visit(prereq)) return false;
      }
      
      temp.delete(courseId);
      visited.add(courseId);
      order.push(courseId);
      
      return true;
    };
    
    const cycles: string[][] = [];
    for (const courseId of this.courseIds) {
      if (!visited.has(courseId)) {
        if (!visit(courseId)) {
          const cycle: string[] = [];
          const cycleStart = Array.from(temp).pop()!;
          let current = cycleStart;
          
          do {
            cycle.push(current);
            for (const [from, toList] of this.prerequisites.entries()) {
              if (toList.includes(current) && temp.has(from)) {
                current = from;
                break;
              }
            }
          } while (current !== cycleStart && cycle.length <= this.courseIds.length);
          
          cycles.push(cycle);
          temp.clear();
        }
      }
    }
    
    if (cycles.length > 0) {
      const cycleMessages = cycles.map(
        (cycle, i) => `Ciclo ${i + 1}: ${cycle.join(' -> ')}`
      ).join('\n');
      
      throw new SchedulingError(
        `Se detectaron ciclos en los prerrequisitos:\n${cycleMessages}`,
        'CYCLE_DETECTED'
      );
    }
    
    return order;
  }

  private calculateCriticalPath() {
    const inDegree = new Map<string, number>();
    const graph = new Map<string, string[]>();
    const distances = new Map<string, number>();
    const previous = new Map<string, string>();
    const credits = new Map<string, number>();

    this.courseIds.forEach(id => {
      const course = this.courses.get(id)!;
      // Incluir todos los cursos en el cálculo del camino crítico.
      inDegree.set(id, 0);
      graph.set(id, []);
      distances.set(id, 0);
      previous.set(id, '');
      credits.set(id, course.credits);
    });

    this.courseIds.forEach(id => {
      const course = this.courses.get(id)!;
      course.prerequisites.forEach(prereqId => {
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
    let lastCourse = '';
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
      current = previous.get(current) || '';
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
    return this.topologicalOrder.filter(courseId => {
      if (this.isCourseInMask(approved | failed, courseId)) return false;
      const prereqs = this.prerequisites.get(courseId) || [];
      return prereqs.every(prereqId => this.isCourseInMask(approved, prereqId));
    });
  }
  private generateValidCombinations(availableCourses: string[]): string[][] {
    const key = [...availableCourses].sort().join(',');
    
    if (this.combinationCache.has(key)) {
      return this.combinationCache.get(key)!;
    }
    
    const combinations: string[][] = [];
    const n = availableCourses.length;
    
    for (let mask = 1; mask < (1 << n); mask++) {
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
      const creditsA = a.reduce((sum, id) => sum + (this.courses.get(id)?.credits || 0), 0);
      const creditsB = b.reduce((sum, id) => sum + (this.courses.get(id)?.credits || 0), 0);
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
        currentCycle: 1
      };
      
      const result = this.dp(initialState);
      
      if (result.cycles === Infinity) {
        throw new SchedulingError(
          'No se pudo encontrar un horario válido con los parámetros dados.',
          'NO_VALID_SCHEDULE'
        );
      }
      
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new SchedulingError(
          `Error al calcular el horario: ${error.message}`,
          'SCHEDULING_ERROR'
        );
      }
      throw error;
    }
  }
  
  public getCriticalPath(): string[] {
    return [...this.criticalPath];
  }
  
  public updateCourseStatus(courseId: string, status: 'approved' | 'failed' | 'not_taken'): void {
    const course = this.courses.get(courseId);
    if (!course) {
      throw new SchedulingError(`Curso no encontrado: ${courseId}`, 'COURSE_NOT_FOUND');
    }
  
    if (course.status === status) return;
  
    if (status === 'approved') {
      const missingPrereqs = (course.prerequisites || []).filter(
        prereqId => this.courses.get(prereqId)?.status !== 'approved'
      );
  
      if (missingPrereqs.length > 0) {
        throw new SchedulingError(
          `No se puede aprobar ${courseId} sin completar los prerrequisitos: ${missingPrereqs.join(', ')}`,
          'MISSING_PREREQUISITES'
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

    const availableCourses = this.getAvailableCourses(state.approved, state.failed);
    
    if (availableCourses.length === 0 && state.approved === (1 << this.courseIds.length) - 1) {
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

      const processOutcome = (outcome: number, index: number, currentApproved: number, currentFailed: number, currentStatuses: { [key: string]: 'approved' | 'failed' }): void => {
        if (index === combination.length) {
          const newState: CourseState = {
            approved: currentApproved,
            failed: currentFailed,
            currentCycle: state.currentCycle + 1
          };

          const result = this.dp(newState);
          
          if (result.cycles + 1 < minCycles) {
            minCycles = result.cycles + 1;
            bestSchedule = [
              {
                cycle: state.currentCycle,
                courses: [...combination],
                credits,
                statuses: { ...currentStatuses }
              },
              ...result.schedule
            ];
          }
          return;
        }

        const courseId = combination[index];
        
        if (outcome & (1 << index)) {
          const newApproved = this.addCourseToMask(currentApproved, courseId);
          processOutcome(outcome, index + 1, newApproved, currentFailed, {
            ...currentStatuses,
            [courseId]: 'approved'
          });
        } 
        else {
          const newFailed = this.addCourseToMask(currentFailed, courseId);
          processOutcome(outcome, index + 1, currentApproved, newFailed, {
            ...currentStatuses,
            [courseId]: 'failed'
          });
        }
      };

      const maxOutcome = 1 << combination.length;
      for (let outcome = 0; outcome < maxOutcome; outcome++) {
        processOutcome(outcome, 0, state.approved, state.failed, {});
      }
    }

    const result = { cycles: minCycles, schedule: bestSchedule };
    
    if (minCycles === Infinity && availableCourses.length > 0) {
      if (availableCourses.length > 0) {
        const forcedCourse = availableCourses[0];
        const courseCredits = this.courses.get(forcedCourse)?.credits || 0;
        
        if (courseCredits <= this.maxCreditsPerCycle) {
          const newState: CourseState = {
            approved: state.approved,
            failed: this.addCourseToMask(state.failed, forcedCourse),
            currentCycle: state.currentCycle + 1
          };
          
          const forcedResult = this.dp(newState);
          if (forcedResult.cycles + 1 < minCycles) {
            minCycles = forcedResult.cycles + 1;
            bestSchedule = [
              {
                cycle: state.currentCycle,
                courses: [forcedCourse],
                credits: courseCredits,
                statuses: { [forcedCourse]: 'failed' }
              },
              ...forcedResult.schedule
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
      currentCycle: 1
    };

    return this.dp(initialState);
  }
}
