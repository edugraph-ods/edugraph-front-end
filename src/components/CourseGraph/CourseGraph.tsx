"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
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
import type { CourseNodeData } from "../../hooks/useCourseGraph";

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

  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node] as const)),
    [nodes]
  );

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

  const miniMapNodeColor = (node: Node<CourseNodeData>) => {
    const data = node.data;
    const status = data?.status;
    const isCritical = Boolean(data?.isInCriticalPath);

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

  const miniMapNodeStroke = () => {
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
  if (planResult) {
    return (
      <div className="h-full flex flex-col">
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">
            {t("detail.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("detail.credits")}: {planResult.totalCycles}
          </p>
        </div>
        <div className="flex-1 min-h-0 overflow-auto space-y-4">
          {planResult.cycles.map((cyclePlan) => {
            const items = cyclePlan.courses
              .map((courseCode) => {
                if (typeof courseCode !== "string") {
                  return null;
                }

                const node = nodeMap.get(courseCode);
                const matchedCourse =
                  scheduleCourses.find((sc) => sc.id === courseCode) ||
                  courses.find((sc) => sc.id === courseCode);

                if (!node && !matchedCourse) {
                  return null;
                }

                const label = node?.data.label ?? matchedCourse?.name ?? courseCode;
                const credits = matchedCourse?.credits ?? 0;
                const prereqSource =
                  node?.data.prerequisites ?? matchedCourse?.prerequisites ?? [];
                const prereqs = prereqSource.filter(
                  (prereqId): prereqId is string =>
                    typeof prereqId === "string" &&
                    (nodeMap.has(prereqId) ||
                      scheduleCourses.some((course) => course.id === prereqId))
                );

                return {
                  id: courseCode,
                  cycle: cyclePlan.cycle,
                  label,
                  credits,
                  prereqs,
                };
              })
              .filter((item): item is {
                id: string;
                cycle: number;
                label: string;
                credits: number;
                prereqs: string[];
              } => Boolean(item));

            return (
              <div key={`plan-cyc-${cyclePlan.cycle}`} className="space-y-2">
                <h4 className="text-md font-medium text-foreground/80">
                  {t("detail.cycle")} {cyclePlan.cycle}
                </h4>
                {items.length > 0 ? (
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 items-stretch"
                    style={{ gridAutoRows: "minmax(180px, auto)" }}
                  >
                    {items.map((item) => (
                      <div
                        key={`${item.id}-${cyclePlan.cycle}`}
                        className={`p-4 rounded-lg border ${
                          selectedCourseId === item.id
                            ? "border-primary bg-accent/50 ring-2 ring-primary/30 dark:ring-primary/20"
                            : selectedCycle === item.cycle
                            ? "border-primary/30 bg-accent/20 dark:bg-primary/10"
                            : "border-border bg-card hover:bg-accent/30"
                        } transition-all cursor-pointer`}
                        onClick={() => onCourseSelect?.(item.id)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-foreground">
                              {item.label}
                            </h5>
                            <p className="text-sm text-muted-foreground">
                              {`${item.credits} ${
                                item.credits === 1
                                  ? t("filters.detail.credit")
                                  : t("filters.detail.credits")
                              }`}
                            </p>
                          </div>
                          <div className="relative">
                            <select
                              value={getCurrentStatus(item.id)}
                              onChange={(e) =>
                                onStatusChange(
                                  item.id,
                                  e.target.value as CourseStatus
                                )
                              }
                              onClick={(e) => e.stopPropagation()}
                              className={`px-3 py-1 rounded-full text-xs font-medium text-center min-w-[110px] cursor-pointer appearance-none ${getStatusColor(
                                getCurrentStatus(item.id)
                              )} hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring`}
                            >
                              <option value="not_taken">
                                {t("filters.detail.selector.faild")}
                              </option>
                              <option value="approved">
                                {t("filters.detail.selector.approved")}
                              </option>
                              <option value="failed">
                                {t("filters.detail.selector.reprobated")}
                              </option>
                            </select>
                            {selectedCourseId === item.id && (
                              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-ping"></div>
                            )}
                          </div>
                        </div>
                        {item.prereqs.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground mb-1">
                              {t("filters.required")}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {item.prereqs.map((prereqId) => (
                                <span
                                  key={prereqId}
                                  className="inline-block text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded-full cursor-pointer hover:bg-accent/80 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCourseSelect?.(prereqId);
                                  }}
                                >
                                  {nodeMap.get(prereqId)?.data.label ??
                                    scheduleCourses.find(
                                      (course) => course.id === prereqId
                                    )?.name ??
                                    prereqId}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailCourseId(item.id);
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-primary border border-input hover:bg-accent rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {t("filters.detail.button")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-muted-foreground">
                    {t("detail.nothing")}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

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
