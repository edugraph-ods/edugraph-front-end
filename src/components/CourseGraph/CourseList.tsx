import React, { useMemo } from "react";
import type { Node } from "reactflow";
import { useTranslation } from "react-i18next";
import type { Course } from "@/domain/entities/course";
import type { PlanResult } from "@/domain/entities/graph";
import type { CourseNodeData } from "../../hooks/useCourseGraph";
import type { CourseStatus } from "./types";

interface CourseListProps {
  nodes: Node<CourseNodeData>[];
  courses: Course[];
  scheduleCourses: Course[];
  selectedCycle?: number | null;
  selectedCourseId?: string | null;
  onCourseSelect?: (id: string) => void;
  onStatusChange: (courseId: string, newStatus: CourseStatus) => void;
  getCurrentStatus: (courseId: string) => CourseStatus;
  getStatusColor: (status: CourseStatus) => string;
  setDetailCourseId: (id: string | null) => void;
  planResult?: PlanResult | null;
}

interface DisplayCourseItem {
  id: string;
  cycle: number;
  label: string;
  credits: number;
  prereqs: string[];
}

export const CourseList: React.FC<CourseListProps> = ({
  nodes,
  courses,
  scheduleCourses,
  selectedCycle,
  selectedCourseId,
  onCourseSelect,
  onStatusChange,
  getCurrentStatus,
  getStatusColor,
  setDetailCourseId,
  planResult,
}) => {
  const { t } = useTranslation("dashboard");

  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [node.id, node] as const)),
    [nodes]
  );
  const creditLabel = (n: number) =>
    `${n} ${
      n === 1 ? t("filters.detail.credit") : t("filters.detail.credits")
    }`;

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
            const items: DisplayCourseItem[] = cyclePlan.courses
              .map((courseCode) => {
                if (typeof courseCode !== "string") {
                  return null;
                }
                const matchedCourse =
                  scheduleCourses.find((sc) => sc.id === courseCode) ||
                  courses.find((sc) => sc.id === courseCode) ||
                  scheduleCourses.find((sc) => sc.code === courseCode) ||
                  courses.find((sc) => sc.code === courseCode);
                const resolvedId = matchedCourse?.id || courseCode;
                const node = nodeMap.get(resolvedId) || nodeMap.get(courseCode);

                const label = node?.data.label ?? matchedCourse?.name ?? courseCode;
                const credits = typeof matchedCourse?.credits === 'number' ? matchedCourse!.credits : 0;
                const prereqSource =
                  node?.data.prerequisites ?? matchedCourse?.prerequisites ?? [];
                const prereqs = prereqSource.filter((prereqId): prereqId is string =>
                  typeof prereqId === "string" &&
                  (nodeMap.has(prereqId) ||
                    scheduleCourses.some((course) => course.id === prereqId) ||
                    scheduleCourses.some((course) => course.code === prereqId))
                );

                return {
                  id: resolvedId,
                  cycle: cyclePlan.cycle,
                  label,
                  credits,
                  prereqs,
                } satisfies DisplayCourseItem;
              })
              .filter((item): item is DisplayCourseItem => Boolean(item));
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
                    {items.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}`}
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
                            <p className="text-sm text-muted-foreground">{`${
                              item.credits
                            } ${
                              item.credits === 1
                                ? t("filters.detail.credit")
                                : t("filters.detail.credits")
                            }`}</p>
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
                              {item.prereqs.map(
                                (prereqId: string, index: number) => (
                                  <span
                                    key={`${prereqId}-${index}`}
                                    className="inline-block text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded-full cursor-pointer hover:bg-accent/80 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onCourseSelect?.(prereqId);
                                    }}
                                  >
                                    {nodeMap.get(prereqId)?.data.label ??
                                      scheduleCourses.find(
                                        (c) => c.id === prereqId
                                      )?.name ??
                                      scheduleCourses.find(
                                        (c) => c.code === prereqId
                                      )?.name ??
                                      prereqId}
                                  </span>
                                )
                              )}
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
  const items = scheduleCourses.map((c) => {
    const n = nodeMap.get(c.id);
    const prereqSource = (
      n?.data.prerequisites ??
      c.prerequisites ??
      []
    ).filter((p: string) => 
      scheduleCourses.some((sc) => sc.id === p) ||
      scheduleCourses.some((sc) => sc.code === p)
    );
    return {
      id: c.id,
      cycle: c.cycle,
      label: n?.data.label ?? c.name,
      credits: typeof c.credits === "number" ? c.credits : 0,
      prereqs: Array.from(new Set(prereqSource)),
    } satisfies DisplayCourseItem;
  });

  const grouped = items.reduce<Record<number, DisplayCourseItem[]>>(
    (acc, item) => {
      if (!acc[item.cycle]) acc[item.cycle] = [];
    acc[item.cycle].push(item);
    return acc;
    },
    {}
  );
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-foreground">
        {t("detail.title")}
      </h3>
      {Object.entries(grouped)
        .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
        .map(([cycle, cycleItems]) => (
          <div key={`cycle-${cycle}`} className="space-y-2">
            <h4 className="text-md font-medium text-foreground/80">
              {t("detail.cycle")} {cycle}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cycleItems.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
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
                        {t("filters.required")}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {item.prereqs.map((prereqId: string, index: number) => (
                          <span
                            key={`${prereqId}-${index}`}
                            className="inline-block text-xs px-2 py-0.5 bg-accent text-accent-foreground rounded-full cursor-pointer hover:bg-accent/80 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              onCourseSelect?.(prereqId);
                            }}
                          >
                            {nodeMap.get(prereqId)?.data.label ??
                              scheduleCourses.find((c) => c.id === prereqId)
                                ?.name ??
                              scheduleCourses.find((c) => c.code === prereqId)
                                ?.name ??
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
          </div>
        ))}
    </div>
  );
};
