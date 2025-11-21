import React from "react";
import { NodeProps } from "reactflow";
import {
  CourseNode,
  CourseNodeData as ImportedCourseNodeData,
} from "../CourseNode";
import type { CourseStatus } from "./types";

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
