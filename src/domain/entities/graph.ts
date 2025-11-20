export interface GraphCourse {
  code: string;
  name: string;
  credits: number;
  cycle: number;
  university?: string | null;
  career?: string | null;
  program?: string | null;
  prerequisites: string[];
}

export interface IngestInput {
  sourcePath?: string;
  university?: string;
  career?: string;
  program?: string;
}

export interface DetectCyclesResult {
  hasCycles: boolean;
  cycles: string[][];
}

export interface PlanInput {
  maxCredits: number;
  approved?: string[];
  targetCodes?: string[];
  failures?: Record<number, string[]>;
  algorithm?: string;
}

export interface PlanCycle {
  cycle: number;
  totalCredits: number;
  courses: string[];
}

export interface PlanResult {
  totalCycles: number;
  cycles: PlanCycle[];
}
