import React from "react";
import type { Course } from "@/domain/entities/course";
import type { Node } from "reactflow";
import { useTranslation } from "react-i18next";
import { createCourseRepository } from "@/infrastructure/repositories/CourseRepositoryImpl";
import { createGetCourseById } from "@/application/useCases/course/createGetCourseById";
import { useStudent } from "@/presentation/hooks/useStudent";
import { useUniversity } from "@/presentation/hooks/useUniversity";

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
  const { getProfile } = useStudent();
  const { listCareersByUniversity, listUniversities } = useUniversity();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [apiCourse, setApiCourse] = React.useState<
    | {
        id: string;
        name: string;
        code: string;
        cycle: number;
        credits: number;
        prerequisites: string[];
      }
    | null
  >(null);
  const [careerName, setCareerName] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    const repo = createCourseRepository();
    const getById = createGetCourseById(repo);
    const run = async (id: string) => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getById(id);
        if (!active) return;
        setApiCourse(data);
      } catch (e: unknown) {
        if (!active) return;
        const message = e instanceof Error ? e.message : "Error";
        setError(message);
        setApiCourse(null);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    if (detailCourseId) {
      run(detailCourseId);
    } else {
      setApiCourse(null);
      setError(null);
      setIsLoading(false);
    }
    return () => {
      active = false;
    };
  }, [detailCourseId]);

  React.useEffect(() => {
    let active = true;
    const loadCareerName = async () => {
      try {
        setCareerName(null);
        const courseItem = detailCourseId
          ? scheduleCourses.find((c) => c.id === detailCourseId) || courses.find((c) => c.id === detailCourseId)
          : null;
        const careerId = courseItem?.career;
        if (!careerId) return;
        const profile = await getProfile();
        const rawUniversity = (profile?.university && profile.university.trim().length > 0)
          ? profile.university
          : (courseItem?.university || "");

        const isUuid = (val: string) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val.trim());

        const resolveFromUniversity = async (uId: string) => {
          const list = await listCareersByUniversity(uId);
          if (!active) return false;
          const match = list.find((c) => c.id === careerId);
          if (match) {
            setCareerName(match.name);
            return true;
          }
          return false;
        };

        if (rawUniversity && isUuid(rawUniversity)) {
          const found = await resolveFromUniversity(rawUniversity);
          if (found) return; 
        } else if (rawUniversity) {
          const universities = await listUniversities();
          const matchU = universities.find((u) => {
            const name = (u.name || "").toLowerCase();
            const acr = (u.acronym || "").toLowerCase();
            const target = rawUniversity.toLowerCase();
            return name === target || acr === target;
          });
          if (matchU) {
            const found = await resolveFromUniversity(matchU.id);
            if (found) return;
          }
        }

        const universities = await listUniversities();
        for (const u of universities) {
          const found = await resolveFromUniversity(u.id);
          if (found) break;
        }
      } catch {
        if (active) setCareerName(null);
      }
    };
    if (detailCourseId) {
      loadCareerName();
    } else {
      setCareerName(null);
    }
    return () => {
      active = false;
    };
  }, [detailCourseId, scheduleCourses, courses, getProfile, listCareersByUniversity, listUniversities]);

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
  const effectivePrereqs = Array.isArray(apiCourse?.prerequisites)
    ? apiCourse!.prerequisites
    : prerequisiteIds;
  const prereqLabels = effectivePrereqs.map((id: string) => {
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

  const isUuidLike = (value: string | undefined | null) => {
    if (!value) return false;
    const v = value.trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  };
  const displayCareer = careerName || (!isUuidLike(course.career) && course.career) || "No especificada";

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 space-y-4">
        {isLoading && (
          <div className="text-sm text-muted-foreground">Cargando...</div>
        )}
        {error && (
          <div className="text-sm text-red-600">{error}</div>
        )}
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
            <p className="font-medium text-foreground">{apiCourse?.name || course.name}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">{t("course.code")}</p>
            <p className="font-medium text-foreground">{apiCourse?.code || course.id}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">{t("course.career")}</p>
            <p className="font-medium text-foreground">
              {displayCareer}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("course.cycle")}</p>
            <p className="font-medium text-foreground">{apiCourse?.cycle ?? course.cycle}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t("course.credits")}</p>
            <p className="font-medium text-foreground">{apiCourse?.credits ?? course.credits}</p>
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
