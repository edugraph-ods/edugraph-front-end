import { Course } from "../../hooks/use-course";
import React from "react";

export type CourseStatus = "not_taken" | "approved" | "failed";

export interface CourseGraphProps {
  courses: Course[];
  displayCourses?: Course[];
  selectedCycle?: number | null;
  selectedCourseId?: string | null;
  onStatusChange: (courseId: string, newStatus: CourseStatus) => void;
  onCourseSelect?: (courseId: string) => void;
  planResult?: {
    total_cycles: number;
    cycles: { cycle: number; total_credits: number; courses: string[] }[];
  } | null;
}

export type NodeData = any;
