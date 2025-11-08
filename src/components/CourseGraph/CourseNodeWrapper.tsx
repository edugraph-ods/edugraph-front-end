import React from "react";
import { NodeProps } from "reactflow";
import {
  CourseNode,
  CourseNodeData as ImportedCourseNodeData,
} from "../CourseNode";
import type { CourseStatus } from "./types";

/**
 * Helper to create the node types mapping for ReactFlow. We keep this as a factory
 * so the `onStatusChange` callback can be captured.
 */
export const createNodeTypes = (
  onStatusChange: (courseId: string, status: CourseStatus) => void
) => {
  const CourseNodeWrapper: React.FC<NodeProps<ImportedCourseNodeData>> = (
    nodeProps
  ) => {
    const handleNodeStatusChange = (courseId: string, status: CourseStatus) => {
      onStatusChange(courseId, status);
    };

    return (
      <CourseNode
        id={nodeProps.id}
        data={nodeProps.data}
        onStatusChange={handleNodeStatusChange}
      />
    );
  };

  return { courseNode: CourseNodeWrapper };
};
