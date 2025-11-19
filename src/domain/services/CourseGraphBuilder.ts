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

    const positions = this.calculatePositions(plannedCourses);
    const nodes = this.createNodes(plannedCourses, positions, criticalPathSet);
    const edges = this.createEdges(nodes, criticalPathSet);

    return {
      nodes,
      edges,
      criticalPath,
    };
  }

  private calculatePositions(courses: Course[]): Map<string, Position> {
    const positions = new Map<string, Position>();
    if (!courses.length) {
      return positions;
    }

    const cycles = Array.from(new Set(courses.map((course) => course.cycle))).sort(
      (a, b) => a - b
    );
    const coursesByCycle = new Map<number, Course[]>(
      cycles.map((cycle) => [cycle, []])
    );

    courses.forEach((course) => {
      const group = coursesByCycle.get(course.cycle);
      if (group) {
        group.push(course);
      } else {
        coursesByCycle.set(course.cycle, [course]);
      }
    });

    cycles.forEach((cycle, cycleIndex) => {
      const items = coursesByCycle.get(cycle) ?? [];
      items.sort((a, b) => {
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
