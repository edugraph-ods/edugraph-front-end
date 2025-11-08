"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Course } from "../../hooks/use-course";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionLineType,
  Connection,
  addEdge,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { useCourseGraph } from "../../hooks/useCourseGraph";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";

import { createNodeTypes } from "./CourseNodeWrapper";
import { CourseList } from "./CourseList";
import { CourseDetailModal } from "./CourseDetailModal";
import { CoursePanelLegend } from "./CoursePanelLegend";
import type { CourseGraphProps, CourseStatus } from "./types";

const CourseGraph: FC<CourseGraphProps> = ({
  courses,
  displayCourses,
  selectedCycle,
  selectedCourseId,
  onCourseSelect,
  onStatusChange,
  planResult,
}) => {
  const [detailCourseId, setDetailCourseId] = useState<string | null>(null);
  const { t } = useTranslation("dashboard");
  const scheduleCourses =
    displayCourses && displayCourses.length ? displayCourses : courses;

  const { nodes, edges, onNodesChange, onEdgesChange, setEdges, isLoading } =
    useCourseGraph(scheduleCourses);

  const getCurrentStatus = useCallback(
    (courseId: string): CourseStatus => {
      const node = nodes.find((n) => n.id === courseId);
      return node?.data?.status || "not_taken";
    },
    [nodes]
  );
  const handleStatusChange = useCallback(
    (courseId: string, newStatus: CourseStatus) => {
      onStatusChange(courseId, newStatus);
    },
    [onStatusChange]
  );

  const getStatusColor = useCallback((status: CourseStatus) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border border-green-300";
      case "failed":
        return "bg-red-100 text-red-800 border border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  }, []);

  const nodeTypes = useMemo(
    () => createNodeTypes(handleStatusChange),
    [handleStatusChange]
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const themeMode = resolvedTheme ?? "light";

  const miniMapNodeColor = (node: Node) => {
    const data: any = node.data ?? {};
    const status = data.status as
      | "approved"
      | "failed"
      | "not_taken"
      | undefined;
    const isCritical = !!data.isInCriticalPath;

    if (isCritical) {
      return themeMode === "dark" ? "#60A5FA" : "#3B82F6";
    }

    switch (status) {
      case "approved":
        return "#10B981";
      case "failed":
        return "#EF4444";
      default:
        return themeMode === "dark" ? "#6B7280" : "#9CA3AF";
    }
  };

  const miniMapNodeStroke = (node: Node) => {
    return themeMode === "dark" ? "#0f172a" : "#ffffff";
  };
  const miniMapStyle: React.CSSProperties = {
    height: 120,
    borderRadius: 8,
    background:
      themeMode === "dark" ? "rgba(2,6,23,0.6)" : "rgba(255,255,255,0.95)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
  };

  const miniMapMaskColor =
    themeMode === "dark" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.6)";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const hasPlan = !!planResult;
  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ height: "calc(100vh - 120px)", minHeight: 0 }}
    >
      <div
        className={`relative ${hasPlan ? "hidden" : "flex-1"}`}
        style={{ minHeight: 0 }}
      >
        {selectedCourseId ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            onNodeClick={(event, node) => onCourseSelect?.(node.id)}
            connectionLineType={ConnectionLineType.SmoothStep}
            defaultEdgeOptions={{
              animated: false,
              style: {
                stroke: "hsl(var(--primary))",
                strokeWidth: 2,
              },
            }}
          >
            <Background gap={12} />
            <Controls />
            {mounted && (
              <MiniMap
                nodeColor={miniMapNodeColor}
                nodeStrokeColor={miniMapNodeStroke}
                nodeBorderRadius={6}
                nodeStrokeWidth={2}
                maskColor={miniMapMaskColor}
                style={miniMapStyle}
              />
            )}
            <Panel
              position="top-right"
              className="bg-card p-4 rounded-lg shadow-lg border border-border"
            >
              <CoursePanelLegend />
            </Panel>
          </ReactFlow>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            {t("graph.description")}
          </div>
        )}
      </div>
      <div
        className={`${
          hasPlan ? "" : "border-t border-border"
        } p-4 bg-card shadow-inner flex-1`}
        style={{ minHeight: 0, overflowY: "auto" }}
      >
        <CourseList
          nodes={nodes}
          courses={courses}
          scheduleCourses={scheduleCourses}
          selectedCycle={selectedCycle}
          selectedCourseId={selectedCourseId}
          onCourseSelect={onCourseSelect}
          onStatusChange={handleStatusChange}
          getCurrentStatus={getCurrentStatus}
          getStatusColor={getStatusColor}
          setDetailCourseId={setDetailCourseId}
          planResult={planResult}
        />
      </div>

      <CourseDetailModal
        detailCourseId={detailCourseId}
        setDetailCourseId={setDetailCourseId}
        nodes={nodes}
        scheduleCourses={scheduleCourses}
        courses={courses}
      />
    </div>
  );
};

export default CourseGraph;
