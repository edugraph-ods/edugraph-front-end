import React from "react";
import type { Course } from "../../hooks/use-course";
import type { Node } from "reactflow";
import { useTranslation } from "react-i18next";

interface DetailModalProps {
  detailCourseId: string | null;
  setDetailCourseId: (id: string | null) => void;
  nodes: Node[];
  scheduleCourses: Course[];
  courses: Course[];
}

export const CourseDetailModal: React.FC<DetailModalProps> = ({
  detailCourseId,
  setDetailCourseId,
  nodes,
  scheduleCourses,
  courses,
}) => {
  const { t } = useTranslation("dashboard");

  if (!detailCourseId) return null;
  const course = scheduleCourses.find((c) => c.id === detailCourseId);
  const node = nodes.find((n) => n.id === detailCourseId);
  if (!course || !node) return null;

  type NodeDataShape = {
    prerequisites?: string[];
    status?: string;
    isInCriticalPath?: boolean;
  };

  const nodeData = (node.data || {}) as NodeDataShape;
  const prerequisiteIds = Array.isArray(nodeData.prerequisites)
    ? nodeData.prerequisites
    : [];

  const prereqLabels = prerequisiteIds.map((id: string) => {
    const match =
      scheduleCourses.find((c) => c.id === id) ||
      courses.find((c) => c.id === id);
    return match?.name || id;
  });

  const dependentLabels = nodes
    .filter((n) => {
      const data = (n.data || {}) as NodeDataShape;
      const deps = Array.isArray(data.prerequisites) ? data.prerequisites : [];
      return deps.includes(detailCourseId);
    })
    .map((n) => {
      const match =
        scheduleCourses.find((c) => c.id === n.id) ||
        courses.find((c) => c.id === n.id);
      return match?.name || n.id;
    });

  const status = nodeData.status ?? "not_taken";
  const isInCriticalPath = Boolean(nodeData.isInCriticalPath);

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {t("course.title")}
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
            <p className="text-muted-foreground">{t("course.course")}</p>
            <p className="font-medium text-foreground">{course.name}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">{t("course.code")}</p>
            <p className="font-medium text-foreground">{course.id}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">{t("course.university")}</p>
            <p className="font-medium text-foreground">
              {course.university || "No especificada"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">{t("course.program")}</p>
            <p className="font-medium text-foreground">
              {course.program || "No especificado"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">{t("course.career")}</p>
            <p className="font-medium text-foreground">
              {course.career || "No especificada"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("course.cycle")}</p>
            <p className="font-medium text-foreground">{course.cycle}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("course.credits")}</p>
            <p className="font-medium text-foreground">{course.credits}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("course.status")}</p>
            <p className="font-medium capitalize text-foreground">
              {status === "not_taken"
                ? "No rendido"
                : status === "approved"
                ? "Aprobado"
                : "Desaprobado"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">
              {t("course.isInCriticalPath")}
            </p>
            <p className="font-medium text-foreground">
              {isInCriticalPath ? "Sí" : "No"}
            </p>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("course.prerequisites")}
            </p>
            {prereqLabels.length ? (
              <ul className="mt-2 space-y-1.5">
                {prereqLabels.map((label: string, idx: number) => (
                  <li
                    key={`${detailCourseId}-pr-${idx}`}
                    className="flex items-center"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
                    <span className="text-sm text-foreground/90">{label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                {t("course.not_required")}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {t("course.release")}
            </p>
            {dependentLabels.length ? (
              <ul className="mt-2 space-y-1.5">
                {dependentLabels.map((label: string, idx: number) => (
                  <li
                    key={`${detailCourseId}-dep-${idx}`}
                    className="flex items-center"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
                    <span className="text-sm text-foreground/90">{label}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">
                {t("course.nothing")}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={() => setDetailCourseId(null)}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            {t("course.close")}
          </button>
        </div>
      </div>
    </div>
  );
};
