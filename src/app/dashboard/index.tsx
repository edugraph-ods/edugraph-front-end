"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { FiChevronDown, FiChevronUp, FiSave, FiTrash } from "react-icons/fi";
import { createBuildDashboardReport } from "../../features/shared/application/useCases/createBuildDashboardReport";
import { createExportDashboardReport } from "../../features/shared/application/useCases/createExportDashboardReport";
import type { Course, CourseStatus } from "../../features/education/courses/domain/entities/course";
import { useDashboard } from "../../hooks/useDashboard";
import type { PlanResult } from "../../features/shared/domain/entities/graph";
import type { StudyPlanSummary } from "../../features/education/courses/domain/entities/coursePlan";
import { useTranslation } from 'react-i18next';
import { DashboardHeader } from "../../components/dashboard/DashboardHeader";
import { useUniversity } from "../../features/education/universities/presentation/hooks/useUniversity";
import type { University } from "../../features/shared/domain/entities/university";
import type { Career as ApiCareer } from "../../features/education/careers/domain/entities/career";
import { useCareer } from "../../features/education/careers/presentation/hooks/useCareer";
import type { DashboardReportLabels } from "../../features/shared/domain/entities/dashboardReport";
import type {
  AcademicProgressRequest,
  AcademicProgressResponse,
  BackendCourseStatus,
  ProgressCourseInput,
} from "../../features/education/academic_progress/domain/entities/progress";
import { createJspdfDashboardReportExporter } from "../../features/shared/infrastructure/exporters/createJspdfDashboardReportExporter";
import { useStudyPlan } from "../../features/education/courses/presentation/hooks/useStudyPlan";

const CourseGraph = dynamic(() => import("@/components/CourseGraph/CourseGraph"), {
  ssr: false,
});

export default function Dashboard() {
  const { t } = useTranslation('dashboard');
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [planError, setPlanError] = useState<string>("");
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("");
  const { listUniversities, listCareersByUniversity } = useUniversity();
  const { listCoursesByCareer, calculateAcademicProgress, getMinPrerequisites } = useCareer();
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [careerOptions, setCareerOptions] = useState<{ id: string; name: string }[]>([]);
  const [isSavePlanModalOpen, setIsSavePlanModalOpen] = useState(false);
  const [isLoadPlanModalOpen, setIsLoadPlanModalOpen] = useState(false);
  const [savePlanName, setSavePlanName] = useState("");
  const [savePlanError, setSavePlanError] = useState("");
  const [loadPlanFeedback, setLoadPlanFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importingPlanRef = useRef(false);
  const pendingCareerRef = useRef<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<StudyPlanSummary[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [loadPlansLoading, setLoadPlansLoading] = useState(false);
  const [loadPlansError, setLoadPlansError] = useState<string>("");
  const [minPrereqResult, setMinPrereqResult] = useState<{
    course_id: string;
    min_courses_required: number;
    courses_in_order: Array<{ id: string; name: string; code: string }>;
  } | null>(null);

  const { create: createStudyPlan, listMine: listMyStudyPlans, getDetail: getStudyPlanDetail, remove: removeStudyPlan } = useStudyPlan();

  const buildDashboardReport = useMemo(() => createBuildDashboardReport(), []);
  const dashboardReportExporter = useMemo(() => createJspdfDashboardReportExporter(), []);
  const exportDashboardReport = useMemo(
    () =>
      createExportDashboardReport({
        buildReport: buildDashboardReport,
        exporter: dashboardReportExporter,
      }),
    [buildDashboardReport, dashboardReportExporter]
  );

  const dashboardReportLabels = useMemo<DashboardReportLabels>(() => ({
    title: t("report.title", { defaultValue: "Reporte académico" }),
    summaryTitle: t("report.summaryTitle", { defaultValue: "Resumen" }),
    generatedAt: t("report.generatedAt", { defaultValue: "Generado el" }),
    university: t("report.university", { defaultValue: "Universidad" }),
    career: t("report.career", { defaultValue: "Carrera" }),
    creditLimit: t("report.creditLimit", { defaultValue: "Límite de créditos" }),
    totalPlannedCredits: t("report.totalPlannedCredits", { defaultValue: "Créditos planificados" }),
    statusTotalsTitle: t("report.statusTotalsTitle", { defaultValue: "Estados" }),
    plannedCoursesTitle: t("report.plannedCoursesTitle", { defaultValue: "Cursos planificados" }),
    allCoursesTitle: t("report.allCoursesTitle", { defaultValue: "Todos los cursos" }),
    planTitle: t("report.planTitle", { defaultValue: "Plan sugerido" }),
    planCyclePrefix: t("report.planCyclePrefix", { defaultValue: "Ciclo" }),
    progressTitle: t("report.progressTitle", { defaultValue: "Estimación de culminación" }),
    progressCycles: t("report.progressCycles", { defaultValue: "Ciclos" }),
    progressMonths: t("report.progressMonths", { defaultValue: "Meses" }),
    progressYears: t("report.progressYears", { defaultValue: "Años" }),
    plannedBadge: t("report.plannedBadge", { defaultValue: "Planificado" }),
    notPlannedBadge: t("report.notPlannedBadge", { defaultValue: "No planificado" }),
    columns: {
      course: t("report.columns.course", { defaultValue: "Curso" }),
      credits: t("report.columns.credits", { defaultValue: "Créditos" }),
      cycle: t("report.columns.cycle", { defaultValue: "Ciclo" }),
      status: t("report.columns.status", { defaultValue: "Estado" }),
    },
    statusLabels: {
      approved: t("report.status.approved", { defaultValue: "Aprobado" }),
      failed: t("report.status.failed", { defaultValue: "Desaprobado" }),
      not_taken: t("report.status.not_taken", { defaultValue: "No cursado" }),
    },
  }), [t]);

  const algorithmOptions = useMemo(
    () => [
      {
        value: "",
        title: t("advanced.dynamic"),
        description: t("advanced.dynamic-description"),
      },
      {
        value: "min_prereqs",
        title: t("advanced.floyd"),
        description: t("advanced.floyd-description"),
      },
    ],
    [t]
  );

  const {
    selectedCycle,
    selectedCareer,
    selectedCourseId,
    expandedCycles,
    handleCareerChange,
    handleLogout,
    toggleCycle,
    updateCourseStatus,
    handleCourseSelect,
    CAREERS,
    cycles,
    courses,
    plannedCourseIds,
    totalPlannedCredits,
    creditLimit,
    isOverCreditLimit,
    togglePlannedCourse,
    setCoursesList,
    setCreditLimit,
    careers,
    setSelectedCareerValue,
    hydrateSavedPlan,
  } = useDashboard();

  const coursesByCareer = useMemo(() => {
    return selectedCareer ? courses.filter((c: Course) => c.career === selectedCareer) : courses;
  }, [courses, selectedCareer]);

  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string>("");
  const [progressResult, setProgressResult] = useState<AcademicProgressResponse | null>(null);
  const [progressWarnings, setProgressWarnings] = useState<string[]>([]);

  const buildProgressPayloadPure = useCallback((): { payload: AcademicProgressRequest; warnings: string[] } => {
    const grouped: Record<number, { cycle: number; courses: ProgressCourseInput[] }> = {};
    const warnings: string[] = [];
    const allIds = new Set(coursesByCareer.map(c => c.id));
    for (const c of coursesByCareer) {
      const status: BackendCourseStatus =
        c.status === "approved" ? "PASSED" : c.status === "failed" ? "FAILED" : "NOT_STARTED";
      const cycleNum = Number.isFinite(c.cycle) ? c.cycle : 0;
      if (!grouped[cycleNum]) grouped[cycleNum] = { cycle: cycleNum, courses: [] };
      const validCredits = Number(c.credits) || 0;
      if (validCredits <= 0) warnings.push(`Curso ${c.id} tiene créditos <= 0`);
      const prereqs = (Array.isArray(c.prerequisites) ? c.prerequisites : []).filter((p) => allIds.has(p));
      const missing = (Array.isArray(c.prerequisites) ? c.prerequisites : []).filter(p => !allIds.has(p));
      if (missing.length) warnings.push(`Curso ${c.id} tiene prerrequisitos inexistentes: ${missing.join(', ')}`);
      grouped[cycleNum].courses.push({
        id: c.id,
        name: c.name,
        credits: validCredits,
        prereqs,
        status,
      });
    }
    const cycles = Object.values(grouped).sort((a, b) => a.cycle - b.cycle);
    const payload = {
      max_credits: typeof creditLimit === 'number' && creditLimit > 0 ? creditLimit : 8,
      cycles,
    };
    return { payload, warnings };
  }, [coursesByCareer, creditLimit]);

  const handleCalculateAcademicProgress = useCallback(async () => {
    if (!selectedCareer) {
      setProgressError("Selecciona una carrera para calcular el progreso");
      return;
    }
    setProgressLoading(true);
    setProgressError("");
    setProgressResult(null);
    setMinPrereqResult(null);
    try {
      if (selectedAlgorithm === "min_prereqs") {
        if (!selectedCourseId) {
          setProgressError(t("advanced.warning-floyd"));
          return;
        }
        const res = await getMinPrerequisites(selectedCareer, selectedCourseId);
        setMinPrereqResult(res);
        setProgressWarnings([]);
      } else {
        const { payload, warnings } = buildProgressPayloadPure();
        setProgressWarnings(warnings);
        const res = await calculateAcademicProgress(selectedCareer, payload);
        setProgressResult(res);
      }
    } catch (e) {
      setProgressError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setProgressLoading(false);
    }
  }, [selectedCareer, selectedCourseId, selectedAlgorithm, buildProgressPayloadPure, calculateAcademicProgress, getMinPrerequisites, t]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const uni = await listUniversities();
        if (!active) return;
        setUniversities(uni);
      } catch (e) {
        console.error("universities load error", e);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [listUniversities]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!importingPlanRef.current) {
        setSelectedCareerValue("");
      }
      if (!selectedUniversity) {
        setCareerOptions([]);
        return;
      }
      try {
        const list = await listCareersByUniversity(selectedUniversity);
        if (!active) return;
        setCareerOptions(list.map((c: ApiCareer) => ({ id: c.id, name: c.name })));
        if (importingPlanRef.current && pendingCareerRef.current) {
          const exists = list.some((c: ApiCareer) => c.id === pendingCareerRef.current);
          if (exists) {
            setSelectedCareerValue(pendingCareerRef.current);
            pendingCareerRef.current = null;
          }
        }
      } catch (e) {
        console.error("careers by university load error", e);
        if (active) setCareerOptions([]);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [listCareersByUniversity, selectedUniversity, setSelectedCareerValue]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!selectedCareer) return;
      try {
        const careerCourses = await listCoursesByCareer(selectedCareer);
        if (!active) return;
        setCoursesList(careerCourses);
        setPlanResult(null);
      } catch (e) {
        console.error("courses by career load error", e);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [listCoursesByCareer, selectedCareer, setCoursesList]);

  const handleStatusChange = useCallback(
    (courseId: string, newStatus: CourseStatus) => {
      updateCourseStatus(courseId, newStatus);
      setPlanResult(null); 
    },
    [updateCourseStatus]
  );

  const handleConfirmSelection = useCallback(async () => {
    try {
      setPlanError("");
      setPlanResult(null);
    } catch (e) {
      setPlanError(e instanceof Error ? e.message : "Unexpected error");
    }
  }, []);

  const handleOpenSavePlanModal = useCallback(() => {
    setSavePlanName("");
    setSavePlanError("");
    setIsSavePlanModalOpen(true);
  }, []);

  const handleCloseSavePlanModal = useCallback(() => {
    setIsSavePlanModalOpen(false);
    setSavePlanError("");
  }, []);

  const handleConfirmPlanSave = useCallback(async () => {
    const trimmedName = savePlanName.trim();
    if (!trimmedName) {
      setSavePlanError(t("plan.saveDialog.validation", { defaultValue: "Ingresa un nombre para el plan." }));
      return;
    }

    try {
      if (!selectedCareer) {
        setSavePlanError(t("filters.careerPlaceholder", { defaultValue: "Selecciona una carrera" }));
        return;
      }

      const planned = plannedCourseIds.length
        ? courses.filter(c => plannedCourseIds.includes(c.id))
        : [];
      if (planned.length === 0) {
        setSavePlanError(t("savePlan.validation.noCourses", { defaultValue: "Selecciona al menos un curso para guardar el plan." }));
        return;
      }

      const grouped: Record<number, { cycle_number: number; courses: Array<{ course_id: string; status: "NOT_STARTED" | "PASSED" | "FAILED"; prerequisites: string[] }> }> = {};
      for (const c of planned) {
        const cycleNum = Number.isFinite(c.cycle) ? c.cycle : 0;
        if (!grouped[cycleNum]) grouped[cycleNum] = { cycle_number: cycleNum, courses: [] };
        const backendStatus = c.status === 'approved' ? 'PASSED' : c.status === 'failed' ? 'FAILED' : 'NOT_STARTED';
        grouped[cycleNum].courses.push({
          course_id: c.id,
          status: backendStatus,
          prerequisites: Array.isArray(c.prerequisites) ? c.prerequisites : [],
        });
      }

      const cyclesPayload = Object
        .values(grouped)
        .filter(group => group.courses.length > 0)
        .sort((a, b) => a.cycle_number - b.cycle_number);

      const requestBody = {
        name: trimmedName,
        max_credits: typeof creditLimit === 'number' && creditLimit > 0 ? creditLimit : 8,
        career_id: selectedCareer,
        cycles: cyclesPayload,
      };

      await createStudyPlan(requestBody);

      setIsSavePlanModalOpen(false);
      setLoadPlanFeedback({ type: "success", message: t("savePlan.save") });
    } catch (err) {
      console.error("study plan create error", err);
      setSavePlanError(err instanceof Error ? err.message : t("savePlan.error"));
    }
  }, [savePlanName, courses, plannedCourseIds, creditLimit, selectedCareer, createStudyPlan, t]);

  const handleLoadSavedDataClick = useCallback(async () => {
    setLoadPlanFeedback(null);
    setLoadPlansError("");
    setAvailablePlans([]);
    setSelectedPlanId("");
    setIsLoadPlanModalOpen(true);
    setLoadPlansLoading(true);
    try {
      const res = await listMyStudyPlans();
      const plans = Array.isArray(res?.study_plans) ? res.study_plans : [];
      setAvailablePlans(plans);
      if (plans[0]?.plan_id) setSelectedPlanId(plans[0].plan_id);
    } catch (e) {
      setLoadPlansError(e instanceof Error ? e.message : t("savePlan.errorload", { defaultValue: "No se pudo obtener los planes." }));
    } finally {
      setLoadPlansLoading(false);
    }
  }, [listMyStudyPlans, t]);

  const handleCloseLoadPlanModal = useCallback(() => {
    setIsLoadPlanModalOpen(false);
    setLoadPlansError("");
  }, []);

  const handleConfirmLoadPlan = useCallback(async () => {
    const chosen = availablePlans.find(p => p.plan_id === selectedPlanId);
    setIsLoadPlanModalOpen(false);
    if (!chosen) {
      setLoadPlanFeedback({ type: "error", message: t("loadPlan.empty", { defaultValue: "No tienes planes guardados" }) });
      return;
    }
    try {
      const detail = await getStudyPlanDetail(chosen.plan_id);
      const courseStatuses = detail.cycles
        .flatMap(c => c.courses)
        .reduce<Record<string, CourseStatus>>((acc, c) => {
          const s = c.status === 'PASSED' ? 'approved' : c.status === 'FAILED' ? 'failed' : 'not_taken';
          acc[c.course_id] = s;
          return acc;
        }, {});
      const plannedCourseIds = detail.cycles.flatMap(c => c.courses.map(cc => cc.course_id));
      const creditLimit = typeof detail.max_credits === 'number' ? detail.max_credits : null;

      if (detail.career_id) {
        setSelectedCareerValue(detail.career_id);
      }

      hydrateSavedPlan({
        plannedCourseIds,
        courseStatuses,
        creditLimit,
      });

      setPlanResult(null);
      setLoadPlanFeedback({ type: "success", message: `${t("loadPlan.selected", { defaultValue: "Plan seleccionado" })}: ${detail.name}` });
    } catch (e) {
      setLoadPlanFeedback({ type: "error", message: e instanceof Error ? e.message : t("savePlan.errorload", { defaultValue: "No se pudo cargar el plan." }) });
    }
  }, [availablePlans, selectedPlanId, getStudyPlanDetail, hydrateSavedPlan, setSelectedCareerValue, t]);

  const handlePlanFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      const data = JSON.parse(content) as {
        planName?: string;
        plannedCourseIds?: string[];
        courseStatuses?: Record<string, CourseStatus | string>;
        creditLimit?: number | null;
        selectedCareer?: string | null;
        selectedUniversity?: string | null;
      };

      const normalizeStatus = (value: string): CourseStatus | undefined => {
        const v = value.toLowerCase();
        if (v === 'aprobado' || v === 'approved') return 'approved';
        if (v === 'desaprobado' || v === 'failed') return 'failed';
        if (v === 'nr' || v === 'not_taken' || v === 'no cursado') return 'not_taken';
        return undefined;
      };

      const normalizedStatuses: Record<string, CourseStatus> | undefined =
        data.courseStatuses && typeof data.courseStatuses === 'object'
          ? Object.entries(data.courseStatuses).reduce<Record<string, CourseStatus>>((acc, [id, val]) => {
              if (typeof val === 'string') {
                const mapped = normalizeStatus(val) ?? (['approved','failed','not_taken'] as Array<string>).includes(val) ? (val as CourseStatus) : undefined;
                if (mapped) acc[id] = mapped;
              }
              return acc;
            }, {})
          : undefined;

      if (typeof data.selectedUniversity === 'string' && data.selectedUniversity) {
        importingPlanRef.current = true;
        setSelectedUniversity(data.selectedUniversity);
      }

      if (typeof data.selectedCareer === 'string') {
        pendingCareerRef.current = data.selectedCareer;
      }

      hydrateSavedPlan({
        plannedCourseIds: Array.isArray(data.plannedCourseIds) ? data.plannedCourseIds : undefined,
        courseStatuses: normalizedStatuses,
        creditLimit: typeof data.creditLimit === 'number' || data.creditLimit === null ? data.creditLimit : undefined,
      });

      setPlanResult(null);
      setLoadPlanFeedback({
        type: "success",
        message: data.planName
          ? t("savePlan.lodas")
          : t("savePlan.lodas"),
      });
    } catch (err) {
      console.error("plan load error", err);
      setLoadPlanFeedback({ type: "error", message: t("savePlan.errorload", { defaultValue: "No se pudo cargar el plan. Verifica el archivo." }) });
    } finally {
      e.target.value = "";
      setTimeout(() => {
        importingPlanRef.current = false;
      }, 0);
    }
  }, [hydrateSavedPlan, t]);

  const handleExportPdf = useCallback(async () => {
    try {
      await exportDashboardReport({
        universityName: selectedUniversity
          ? universities.find((u) => u.id === selectedUniversity)?.name
          : undefined,
        careerName: selectedCareer
          ? (careerOptions.find((c) => c.id === selectedCareer) ?? careers.find((c) => c.id === selectedCareer))?.name
          : undefined,
        creditLimit,
        totalPlannedCredits,
        courses,
        plannedCourseIds,
        planResult,
        progressEstimate: progressResult,
        labels: dashboardReportLabels,
      });
    } catch (error) {
      console.error("dashboard report export error", error);
    }
  }, [
    exportDashboardReport,
    selectedUniversity,
    universities,
    selectedCareer,
    careerOptions,
    careers,
    creditLimit,
    totalPlannedCredits,
    courses,
    plannedCourseIds,
    planResult,
    progressResult,
    dashboardReportLabels,
  ]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Hidden file input for load */}
      <input ref={fileInputRef} type="file" accept=".json,.edugraph-plan,.edugraphplan" className="hidden" onChange={handlePlanFileChange} />
      {/* Header */}
      <DashboardHeader
        onLogout={handleLogout}
        onExportPdf={handleExportPdf}
        onLoadSavedData={handleLoadSavedDataClick}
        onConfirmSelection={handleOpenSavePlanModal}
      />

      {/* Main Content */}
      <div className="p-6">
        {loadPlanFeedback ? (
          <div
            className={`mb-4 rounded-md border px-4 py-3 text-sm ${
              loadPlanFeedback.type === "success"
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/40 dark:text-red-200"
            }`}
          >
            {loadPlanFeedback.message}
          </div>
        ) : null}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Filters + Advanced + Academic Progress */}
          <div className="lg:col-span-1 space-y-6">
            {/* Filters Card */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="flex items-center justify-between p-6">
                <h2 className="text-lg font-semibold">{t("filters.title")}</h2>
                <button
                  onClick={() => setFiltersCollapsed((v) => !v)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-primary/60 focus:ring-offset-2 ${
                    filtersCollapsed
                      ? "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                      : "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
                  }`}
                >

                  <span>{t(`button.${filtersCollapsed ? "show" : "hide"}`)}</span>
                  <svg
                    className={`h-3 w-3 transition-transform duration-200 ${
                      filtersCollapsed ? "rotate-0" : "-rotate-90"
                    }`}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 4l3 3 3-3"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              {!filtersCollapsed && (
                <div className="p-6 pt-4">

                  {/* Universities Selector */}
                  <div className="mb-6">
                    <label
                      htmlFor="university"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      {t("filters.university")}
                    </label>
                    <select
                      id="university"
                      value={selectedUniversity}
                      onChange={(e) => setSelectedUniversity(e.target.value)}
                      className="flex items-center justify-between w-full p-2 text-left text-sm font-medium text-foreground bg-background border border-input rounded-md shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      <option value="">{t("filters.universityPlaceholder")}</option>
                      {universities.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.acronym ? `${u.acronym} - ${u.name}` : u.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Career Selector */}
                  <div className="mb-6">
                    <label
                      htmlFor="career"
                      className="block text-sm font-medium text-foreground mb-1"
                    >
                      {t("filters.career")}
                    </label>
                    <select
                      id="career"
                      value={selectedCareer}
                      onChange={handleCareerChange}
                      className="flex items-center justify-between w-full p-2 text-left text-sm font-medium text-foreground bg-background border border-input rounded-md shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                    >
                      <option value="">{t("filters.careerPlaceholder")}</option>
                      {(careerOptions.length ? careerOptions : (careers.length ? careers : CAREERS)).map((career) => (
                        <option key={career.id} value={career.id}>
                          {career.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Academic Load */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">{t("filters.loading")}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{t("filters.total")}</span>
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${typeof creditLimit === 'number' && totalPlannedCredits < creditLimit ? 'bg-green-100 text-green-700' : (isOverCreditLimit ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700')}`}>
                        {totalPlannedCredits} / {typeof creditLimit === 'number' ? creditLimit : '-'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <label htmlFor="creditLimit" className="block text-xs text-gray-600 mb-1">{t("filters.limit")}</label>
                      <input
                        id="creditLimit"
                        type="number"
                        min={1}
                        step={1}
                        value={typeof creditLimit === 'number' ? creditLimit : ''}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          setCreditLimit(Number.isFinite(v) && v > 0 ? v : null);
                        }}
                        className="w-full p-2 border border-input bg-background rounded-md shadow-sm focus:ring-2 focus:ring-ring focus:border-ring"
                      />
                    </div>
                    {isOverCreditLimit && (
                      <p className="mt-2 text-xs text-red-600"> {t("filters.warning", { creditLimit })}</p>
                    )}
                    <button
                      className={`mt-3 w-full px-3 py-2 rounded text-sm font-medium transition-all duration-200 ease-out cursor-pointer hover:scale-[1.04] ${
                        typeof creditLimit === 'number' && creditLimit > 0
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                      }`}
                      disabled={!(typeof creditLimit === 'number' && creditLimit > 0)}
                      onClick={handleConfirmSelection}
                    >
                      {t("filters.button")}
                    </button>
                    {planError && (
                      <p className="mt-2 text-xs text-red-600">{planError}</p>
                    )}
                  </div>

                  {/* Cycles List */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">{t("filters.cycles")}</h3>
                    {cycles.map((cycle) => (
                      <div key={cycle} className="space-y-1">
                        <button
                          onClick={() => toggleCycle(cycle)}
                          className={`w-full flex justify-between items-center p-3 rounded-md ${
                            expandedCycles.includes(cycle)
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted hover:bg-accent/50 text-foreground"
                          } transition-colors`}
                        >
                          <span className="font-medium">{t("filters.cycle")} {cycle}</span>
                          {expandedCycles.includes(cycle) ? (
                            <FiChevronUp className="text-blue-500" />
                          ) : (
                            <FiChevronDown className="text-gray-400" />
                          )}
                        </button>
                        {expandedCycles.includes(cycle) && (
                          <div className="p-2 space-y-1">
                            {coursesByCareer
                              .filter((course: Course) => course.cycle === cycle)
                              .map((course: Course) => (
                                <div
                                  key={course.id}
                                  onClick={() => handleCourseSelect(course.id)}
                                  className={`flex items-center py-1.5 px-3 text-sm cursor-pointer rounded-md ${
                                    selectedCourseId === course.id
                                      ? "bg-accent text-accent-foreground"
                                      : "hover:bg-accent/50"
                                  } transition-colors`}
                                >
                                  <input
                                    type="checkbox"
                                    className="mr-3 h-4 w-4"
                                    checked={plannedCourseIds.includes(course.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      togglePlannedCourse(course.id);
                                    }}
                                  />
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      selectedCourseId === course.id
                                        ? "bg-primary"
                                        : "bg-muted-foreground/30"
                                    } mr-3`}
                                  ></span>
                                  <span className="truncate">{course.name}</span>
                                  <span
                                    className={`ml-auto text-xs px-1.5 py-0.5 rounded ${
                                      selectedCourseId === course.id
                                        ? "bg-primary/10 text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {course.credits} {t("filters.credits")}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Academic Progress Card */}
                  <div className="mt-6 p-4 rounded-md border">
                    <h3 className="text-sm font-semibold mb-2">{t("progress.title")}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{t("progress.description")}</p>
                    <button
                      onClick={handleCalculateAcademicProgress}
                      disabled={progressLoading || !selectedCareer}
                      className={`w-full px-3 py-2 rounded text-sm font-medium transition-all duration-200 ease-out hover:scale-[1.03] cursor-pointer ${progressLoading || !selectedCareer ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                    >
                      {progressLoading ? t("progress.button-calculate") : t("progress.button")}
                    </button>
                    {progressError && (
                      <p className="mt-2 text-xs text-red-600">{progressError}</p>
                    )}
                    {!!progressWarnings.length && selectedAlgorithm !== 'min_prereqs' && (
                      <ul className="mt-2 text-xs text-amber-600 list-disc list-inside">
                        {progressWarnings.map((w, i) => (
                          <li key={i}>{w}</li>
                        ))}
                      </ul>
                    )}
                    {selectedAlgorithm !== 'min_prereqs' && progressResult && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">{t("progress.cycle")}</div>
                          <div className="text-base font-semibold">{progressResult.cycles_needed_to_graduate}</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">{t("progress.mounth")}</div>
                          <div className="text-base font-semibold">{progressResult.months_needed_to_graduate}</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">{t("progress.year")}</div>
                          <div className="text-base font-semibold">{progressResult.years_needed_to_graduate}</div>
                        </div>
                      </div>
                    )}
                    {selectedAlgorithm === 'min_prereqs' && minPrereqResult && (
                      <div className="mt-3 text-xs space-y-2">
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">{t("advanced.course-floyd")}</div>
                          <div className="text-base font-semibold">
                            {coursesByCareer.find(c => c.id === minPrereqResult.course_id)?.name || minPrereqResult.course_id}
                          </div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">{t("advanced.minium-floyd")}</div>
                          <div className="text-base font-semibold">{minPrereqResult.min_courses_required}</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-muted-foreground">{t("advanced.sequence-floyd")}</div>
                          <ol className="list-decimal list-inside mt-1 space-y-0.5">
                            {minPrereqResult.courses_in_order.map((c) => (
                              <li key={c.id}>{c.name} ({c.code})</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Advanced Settings Card */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="flex items-center justify-between p-6">
                <h2 className="text-lg font-semibold">{t("filters.advanced.title")}</h2>
                <button
                  onClick={() => setAdvancedOpen((v) => !v)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-primary/60 focus:ring-offset-2 ${
                    advancedOpen
                      ? "border-primary/50 bg-primary/5 text-primary hover:bg-primary/10"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                  }`}
                >
                  <span>{t(`button.${advancedOpen ? "hide" : "show"}`)}</span>
                  <svg
                    className={`h-3 w-3 transition-transform duration-200 ${
                      advancedOpen ? "-rotate-90" : "rotate-0"
                    }`}
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 4l3 3 3-3"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              {advancedOpen && (
                <div className="p-6 pt-0 space-y-4">
                  <fieldset className="space-y-3">
                    <legend className="text-sm font-medium text-foreground">
                      {t("filters.advanced.description")}
                    </legend>
                    <div className="space-y-2">
                      {algorithmOptions.map((option) => {
                        const isSelected = selectedAlgorithm === option.value;
                        return (
                          <label
                            key={option.value || "auto"}
                            className={`flex items-start gap-3 rounded-xl border px-3 py-2 transition-colors ${
                              isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                                : "border-border hover:border-primary/40"
                            }`}
                          >
                            <input
                              type="radio"
                              name="algorithm"
                              value={option.value}
                              checked={isSelected}
                              onChange={() => setSelectedAlgorithm(option.value)}
                              className="mt-1 h-4 w-4 accent-primary"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">
                                {option.title}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {option.description}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap justify-end gap-3" />
          </div>

          {/* Graph */}
        <div className="lg:col-span-3 bg-card rounded-xl p-6 shadow-sm border border-border flex flex-col" style={{ minHeight: 'calc(100vh - 120px)' }}>
          <div className="flex flex-col flex-1 min-h-0">
            <CourseGraph
              courses={courses}
              displayCourses={coursesByCareer}
              selectedCycle={selectedCycle}
              selectedCourseId={selectedCourseId}
              onCourseSelect={handleCourseSelect}
              onStatusChange={handleStatusChange}
              planResult={planResult}
            />
          </div>
        </div>
      </div>
      {isSavePlanModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">{t("savePlan.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("savePlan.description")}</p>
            <div className="mt-4 space-y-2">
              <label htmlFor="plan-name" className="text-sm font-medium text-foreground">{t("savePlan.text")}</label>
              <input id="plan-name" type="text" value={savePlanName} onChange={(ev) => { setSavePlanName(ev.target.value); if (savePlanError) setSavePlanError(""); }}
                     placeholder={t("savePlan.namePlaceholder")}
                     className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50" />
              {savePlanError ? (<p className="text-xs text-destructive">{savePlanError}</p>) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={handleCloseSavePlanModal} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-all duration-200 ease-out hover:scale-[1.03] cursor-pointer">
                {t("savePlan.cancel")}
              </button>
              <button type="button" onClick={handleConfirmPlanSave} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm not-even:hover:bg-primary/90 transition-all duration-200 ease-out hover:scale-[1.03] cursor-pointer">
                <FiSave className="h-4 w-4" />
                {t("savePlan.button")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isLoadPlanModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">{t("loadPlan.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("loadPlan.description")}</p>
            <div className="mt-4 space-y-3 max-h-72 overflow-auto">
              {loadPlansLoading ? (
                <p className="text-sm text-muted-foreground">{t("loadPlan.loading")}</p>
              ) : loadPlansError ? (
                <p className="text-sm text-destructive">{loadPlansError}</p>
              ) : availablePlans.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("loadPlan.empty")}</p>
              ) : (
                availablePlans.map((p) => (
                  <div key={p.plan_id} className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${selectedPlanId === p.plan_id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="radio"
                        name="selected-plan"
                        checked={selectedPlanId === p.plan_id}
                        onChange={() => setSelectedPlanId(p.plan_id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm text-foreground">{p.name}</span>
                    </label>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await removeStudyPlan(p.plan_id);
                          const res = await listMyStudyPlans();
                          const plans = Array.isArray(res?.study_plans) ? res.study_plans : [];
                          setAvailablePlans(plans);
                          if (plans.length === 0) setSelectedPlanId("");
                          setLoadPlanFeedback({ type: "success", message: t("loadPlan.deleted") });
                        } catch (err) {
                          setLoadPlanFeedback({ type: "error", message: err instanceof Error ? err.message : t("loadPlan.errorload") });
                        }
                      }}
                      className="p-2 rounded-md text-destructive hover:bg-destructive/10 hover:scale-[1.03] transition"
                      title={t("loadPlan.delete")}
                    >
                      <FiTrash className="h-4 w-4 cursor-pointer" />
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={handleCloseLoadPlanModal} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted transition-all duration-200 ease-out hover:scale-[1.03] cursor-pointer">
                {t("savePlan.cancel")}
              </button>
              <button type="button" onClick={handleConfirmLoadPlan} disabled={!selectedPlanId}
                      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 ease-out hover:scale-[1.03] cursor-pointer ${selectedPlanId ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                {t("savePlan.load")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  </div>
);
}
