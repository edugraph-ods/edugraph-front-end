import type {
  GraphCourse,
  DetectCyclesResult,
  IngestInput,
  PlanInput,
  PlanResult,
} from "../entities/graph";

export interface GraphRepository {
  ingest(input: IngestInput): Promise<GraphCourse[]>;
  getCourses(): Promise<GraphCourse[]>;
  detectCycles(): Promise<DetectCyclesResult>;
  plan(input: PlanInput): Promise<PlanResult>;
}
