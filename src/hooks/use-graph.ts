import { useCallback } from "react";
import { getJson, postJson } from "@/lib/api-client";

export type CourseOut = {
  code: string;
  name: string;
  credits: number;
  cycle: number;
  university?: string | null;
  career?: string | null;
  program?: string | null;
  prerequisites: string[];
};

export type DetectCyclesResponse = {
  has_cycles: boolean;
  cycles: string[][];
};

export type IngestRequest = {
  source_path?: string;
  university?: string;
  career?: string;
  program?: string;
};

export type PlanRequest = {
  max_credits: number;
  approved?: string[];
  target_codes?: string[];
  failures?: Record<number, string[]>;
};

export type PlanResponse = {
  total_cycles: number;
  cycles: Array<{
    cycle: number;
    total_credits: number;
    courses: string[];
  }>;
};

export const useGraphApi = () => {
  const ingest = useCallback(async (payload: IngestRequest) => {
    return postJson<CourseOut[]>("/api/v1/graph/ingest", payload);
  }, []);

  const getCourses = useCallback(async () => {
    return getJson<CourseOut[]>("/api/v1/graph/courses");
  }, []);

  const detectCycles = useCallback(async () => {
    return getJson<DetectCyclesResponse>("/api/v1/graph/detect-cycles");
  }, []);

  const plan = useCallback(async (payload: PlanRequest) => {
    if (payload.max_credits === undefined) {
      throw new Error("max_credits es requerido para generar el plan");
    }
    return postJson<PlanResponse>("/api/v1/graph/plan", payload);
  }, []);

  return { 
    ingest, 
    getCourses, 
    detectCycles, 
    plan 
  };
};