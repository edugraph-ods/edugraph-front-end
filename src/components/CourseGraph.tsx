"use client";

import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { Course } from "../hooks/use-course";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ConnectionLineType,
  Connection,
  addEdge,
  NodeProps,
  Node,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  CourseNode,
  CourseNodeData as ImportedCourseNodeData,
} from "./CourseNode";
import { useCourseGraph } from "../hooks/useCourseGraph";
import { useTheme } from "next-themes";
import { useTranslation } from 'react-i18next';

type CourseStatus = "not_taken" | "approved" | "failed";

interface CourseGraphProps {
  courses: Course[];
  displayCourses?: Course[];
  selectedCycle?: number | null;
  selectedCourseId?: string | null;
  onStatusChange: (courseId: string, newStatus: CourseStatus) => void;
  onCourseSelect?: (courseId: string) => void;
}

const CourseGraph: FC<CourseGraphProps> = ({
  courses,
  displayCourses,
  selectedCycle,
  selectedCourseId,
  onCourseSelect,
  onStatusChange,
}) => {
  const [detailCourseId, setDetailCourseId] = useState<string | null>(null);
  const { t } = useTranslation('dashboard');
  const scheduleCourses =
    displayCourses && displayCourses.length ? displayCourses : courses;

  const { nodes, edges, onNodesChange, onEdgesChange, setEdges, isLoading } =
    useCourseGraph(scheduleCourses);

  const getCurrentStatus = useCallback(
    (courseId: string): CourseStatus => {
      const node = nodes.find((n) => n.id === courseId);
      return (node?.data)?.status || "not_taken";
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

  const CourseNodeWrapper: FC<NodeProps<ImportedCourseNodeData>> = (
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

  const nodeTypes = useMemo(
    () => ({ courseNode: CourseNodeWrapper }),
    [CourseNodeWrapper, onStatusChange]
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const renderSchedule = () => {
    const creditLabel = (n: number) =>
      `${n} ${n === 1 ? t('filters.detail.credit') : t('filters.detail.credits')}`;
    const allowedIds = new Set(scheduleCourses.map((c) => c.id));
    const nodeMap = new Map(nodes.map((n) => [n.id, n] as const));

    type Item = {
      id: string;
      cycle: number;
      label: string;
      credits: number;
      prereqs: string[];
    };
    const items: Item[] = scheduleCourses.map((c) => {
      const n = nodeMap.get(c.id);
      const prereqSource = (
        n?.data.prerequisites ??
        c.prerequisites ??
        []
      ).filter((p: string) => allowedIds.has(p));
      return {
        id: c.id,
        cycle: c.cycle,
        label: n?.data.label ?? c.name,
        credits: typeof c.credits === "number" ? c.credits : 0,
        prereqs: Array.from(new Set(prereqSource)),
      };
    });

    const grouped = items.reduce<Record<number, Item[]>>((acc, item) => {
      if (!acc[item.cycle]) acc[item.cycle] = [];
      acc[item.cycle].push(item);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-foreground">
          {t('detail.title')}
        </h3>
        {Object.entries(grouped)
          .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
          .map(([cycle, cycleItems]) => (
            <div key={`cycle-${cycle}`} className="space-y-2">
              <h4 className="text-md font-medium text-foreground/80">
                {t('detail.cycle')} {cycle}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {cycleItems.map((item) => (
                  <div
                    key={item.id}
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
                          {creditLabel(item.credits)}
                        </p>
                      </div>
                      <div className="relative">
                        <select
                          value={getCurrentStatus(item.id)}
                          onChange={(e) =>
                            handleStatusChange(
                              item.id,
                              e.target.value as CourseStatus
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          className={`px-3 py-1 rounded-full text-xs font-medium text-center min-w-[110px] cursor-pointer appearance-none ${getStatusColor(
                            getCurrentStatus(item.id)
                          )} hover:opacity-90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring`}
                        >
                          <option value="not_taken">{t('filters.detail.selector.faild')}</option>
                          <option value="approved">{t('filters.detail.selector.approved')}</option>
                          <option value="failed">{t('filters.detail.selector.reprobated')}</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                          <svg
                            className="fill-current h-4 w-4"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                        {selectedCourseId === item.id && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-ping"></div>
                        )}
                      </div>
                    </div>

                    {item.prereqs.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t('filters.required')}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {item.prereqs.map((prereqId, index) => {
                            const prereq = nodeMap.get(prereqId);
                            return (
                              <span
                                key={`${prereqId}-${index}`}
                                className="inline-block text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded-full cursor-pointer hover:bg-accent/80 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCourseSelect?.(prereqId);
                                }}
                              >
                                {prereq?.data.label ??
                                  scheduleCourses.find((c) => c.id === prereqId)
                                    ?.name ??
                                  prereqId}
                              </span>
                            );
                          })}
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
                        {t('filters.detail.button')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    );
  };
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

  return (
    <div
      className="h-full w-full flex flex-col"
      style={{ height: "calc(100vh - 200px)" }}
    >
      <div className="flex-1 relative" style={{ minHeight: 0 }}>
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
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">{t('graph.title')}</h3>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-600 rounded-full mr-2"></div>
                  <span className="text-sm text-foreground">{t('graph.approved')}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-600 rounded-full mr-2"></div>
                  <span className="text-sm text-foreground">{t('graph.failed')}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-muted border border-border rounded-full mr-2"></div>
                  <span className="text-sm text-foreground">{t('graph.not_taken')}</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-primary/10 border-2 border-primary rounded-full mr-2"></div>
                  <span className="text-sm text-foreground">{t('graph.critical')}</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            {t('graph.description')}
          </div>
        )}
      </div>

      {/* Course Flow Detail Section */}
      <div
        className="border-t border-border p-4 bg-card shadow-inner"
        style={{ flexShrink: 0, maxHeight: "40%", overflowY: "auto" }}
      >
        {renderSchedule()}
      </div>

      {/* Detail modal */}
      {detailCourseId
        ? (() => {
            const course = scheduleCourses.find((c) => c.id === detailCourseId);
            const node = nodes.find((n) => n.id === detailCourseId);
            if (!course || !node) return null;

            const prereqLabels = (node.data.prerequisites || []).map(
              (id: string) => {
                const match =
                  scheduleCourses.find((c) => c.id === id) ||
                  courses.find((c) => c.id === id);
                return match?.name || id;
              }
            );

            const dependents = nodes
              .filter((n) =>
                (n.data.prerequisites || []).includes(detailCourseId)
              )
              .map((n) => {
                const match =
                  scheduleCourses.find((c) => c.id === n.id) ||
                  courses.find((c) => c.id === n.id);
                return match?.name || n.id;
              });

            return (
              <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">
                        {t('course.title')}
                      </h2>
                    </div>
                    <button
                      onClick={() => setDetailCourseId(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none"
                      aria-label="Cerrar diálogo"
                    >
                      ×
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="col-span-2">
                      <p className="text-muted-foreground">{t('course.course')}</p>
                      <p className="font-medium text-foreground">
                        {course.name}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">{t('course.code')}</p>
                      <p className="font-medium text-foreground">{course.id}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">{t('course.university')}</p>
                      <p className="font-medium text-foreground">
                        {course.university || "No especificada"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">{t('course.program')}</p>
                      <p className="font-medium text-foreground">
                        {course.program || "No especificado"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">{t('course.career')}</p>
                      <p className="font-medium text-foreground">
                        {course.career || "No especificada"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('course.cycle')}</p>
                      <p className="font-medium text-foreground">
                        {course.cycle}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('course.credits')}</p>
                      <p className="font-medium text-foreground">
                        {course.credits}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('course.status')}</p>
                      <p className="font-medium capitalize text-foreground">
                        {(node.data as any).status === "not_taken"
                          ? "No rendido"
                          : (node.data as any).status === "approved"
                          ? "Aprobado"
                          : "Desaprobado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('course.isInCriticalPath')}</p>
                      <p className="font-medium text-foreground">
                        {(node.data as any).isInCriticalPath ? "Sí" : "No"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t('course.prerequisites')}
                      </p>
                      {prereqLabels.length ? (
                        <ul className="mt-2 space-y-1.5">
                          {prereqLabels.map((label, idx) => (
                            <li
                              key={`${detailCourseId}-pr-${idx}`}
                              className="flex items-center"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
                              <span className="text-sm text-foreground/90">
                                {label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('course.not_required')}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t('course.release')}
                      </p>
                      {dependents.length ? (
                        <ul className="mt-2 space-y-1.5">
                          {dependents.map((label, idx) => (
                            <li
                              key={`${detailCourseId}-dep-${idx}`}
                              className="flex items-center"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
                              <span className="text-sm text-foreground/90">
                                {label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {t('course.nothing')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setDetailCourseId(null)}
                      className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                      {t('course.close')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()
        : null}
    </div>
  );
};

export default CourseGraph;
