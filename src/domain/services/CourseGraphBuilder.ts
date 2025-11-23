import type { Course, CourseStatus } from "@/domain/entities/course";
import type {
  CourseGraphEdge,
  CourseGraphNode,
  CourseGraphResult,
} from "@/domain/entities/coursePlan";
import { CoursePlanner, type CoursePlannerOptions } from "@/domain/services/CoursePlanner";

interface Position {
  x: number;
  y: number;
}

const X_GAP = 320;
const Y_GAP = 110;
const PADDING_X = 80;
const PADDING_Y = 60;

const defaultStatus: CourseStatus = "not_taken";

export type BuildCourseGraphOptions = CoursePlannerOptions;

export class CourseGraphBuilder {
  public build(
    courses: Course[],
    options?: BuildCourseGraphOptions
  ): CourseGraphResult {
    const planner = new CoursePlanner(courses, options);
    const plannedCourses = planner.getCourses();
    const criticalPath = planner.getCriticalPath();
    const criticalPathSet = new Set(criticalPath);

    const codeToId = new Map<string, string>();
    for (const c of plannedCourses) {
      const idKey = (c.id || '').toString().trim().toLowerCase();
      if (idKey) codeToId.set(idKey, c.id);
      const code = (c as unknown as { code?: string }).code;
      if (typeof code === 'string' && code.trim().length) {
        codeToId.set(code.trim().toLowerCase(), c.id);
      }
    }
    const sanitized = plannedCourses.map((c) => {
      const next: Course = { ...c };
      const seen = new Set<string>();
      const out: string[] = [];
      const raw = Array.isArray(c.prerequisites) ? c.prerequisites : [];
      for (const r of raw) {
        const key = typeof r === 'string' ? r.trim().toLowerCase() : String(r ?? '').trim().toLowerCase();
        if (!key) continue;
        let resolved = codeToId.get(key) || null;
        if (!resolved) {
          resolved = plannedCourses.find((pc) => pc.id === (r as string))?.id || null;
        }
        if (!resolved) continue;
        if (resolved === c.id) continue; 
        if (seen.has(resolved)) continue;
        seen.add(resolved);
        out.push(resolved);
      }
      next.prerequisites = out;
      return next;
    });

    console.log('CourseGraphBuilder debug - planned courses with prerequisites (sanitized):');
    sanitized.forEach(course => {
      console.log(`${course.name} (${course.id}): prerequisites =`, course.prerequisites);
    });

    const positions = this.calculatePositions(sanitized);
    const nodes = this.createNodes(sanitized, positions, criticalPathSet);
    const edges = this.createEdges(nodes, criticalPathSet);

    console.log('CourseGraphBuilder debug - created edges:');
    edges.forEach(edge => {
      console.log(`${edge.source} -> ${edge.target}`);
    });

    return {
      nodes,
      edges,
      criticalPath,
    };
  }

  private calculatePositions(courses: Course[]): Map<string, Position> {
    const positions = new Map<string, Position>();
    const coursesByCycle = new Map<number, Course[]>();
    
    for (const course of courses) {
      const cycle = course.cycle || 0;
      if (coursesByCycle.has(cycle)) {
        coursesByCycle.get(cycle)!.push(course);
      } else {
        coursesByCycle.set(cycle, [course]);
      }
    }

    const cycles = Array.from(coursesByCycle.keys()).sort((a, b) => a - b);

    cycles.forEach((cycle, cycleIndex) => {
      const items = coursesByCycle.get(cycle) || [];
      
      items.sort((a, b) => {
        const prereqCountA = (a.prerequisites || []).length;
        const prereqCountB = (b.prerequisites || []).length;
        
        if (prereqCountA !== prereqCountB) {
          return prereqCountA - prereqCountB;
        }
        
        const outgoingA = courses.filter((course) =>
          (course.prerequisites || []).includes(a.id)
        ).length;
        const outgoingB = courses.filter((course) =>
          (course.prerequisites || []).includes(b.id)
        ).length;
        
        return outgoingB - outgoingA;
      });

      items.forEach((course, rowIndex) => {
        const x = PADDING_X + cycleIndex * X_GAP;
        const y = PADDING_Y + rowIndex * Y_GAP;
        positions.set(course.id, { x, y });
      });
    });

    return positions;
  }

  private createNodes(
    courses: Course[],
    positions: Map<string, Position>,
    criticalPath: Set<string>
  ): CourseGraphNode[] {
    return courses.map((course) => {
      const position = positions.get(course.id) ?? { x: 0, y: 0 };
      const isCritical = criticalPath.has(course.id);

      return {
        id: course.id,
        label: course.name,
        status: course.status ?? defaultStatus,
        credits: course.credits,
        cycle: course.cycle,
        prerequisites: course.prerequisites || [],
        position,
        isCritical,
        isInCriticalPath: isCritical,
      } satisfies CourseGraphNode;
    });
  }

  private createEdges(
    nodes: CourseGraphNode[],
    criticalPath: Set<string>
  ): CourseGraphEdge[] {
    const edges: CourseGraphEdge[] = [];
    const seen = new Set<string>();
    const nodeMap = new Map(nodes.map((node) => [node.id, node] as const));

    nodes.forEach((node) => {
      node.prerequisites.forEach((sourceId) => {
        if (!nodeMap.has(sourceId)) {
          return;
        }

        const edgeId = `${sourceId}-${node.id}`;
        if (seen.has(edgeId)) {
          return;
        }

        seen.add(edgeId);
        const isCritical = criticalPath.has(sourceId) && criticalPath.has(node.id);

        edges.push({
          id: edgeId,
          source: sourceId,
          target: node.id,
          isCritical,
        });
      });
    });

    return edges;
  }
}
