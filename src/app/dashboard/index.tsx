"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { FiChevronDown, FiChevronUp, FiSave, FiTrash2 } from "react-icons/fi";
import type { Course, CourseStatus } from "@/domain/entities/course";
import { useDashboard } from "@/hooks/useDashboard";
import { useGraph } from "@/presentation/hooks/useGraph";
import type { PlanResult } from "@/domain/entities/graph";
import { useTranslation } from 'react-i18next';
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useUniversity } from "@/presentation/hooks/useUniversity";
import type { University } from "@/domain/entities/university";
import type { Career as ApiCareer } from "@/domain/entities/career";
import { useCareer } from "@/presentation/hooks/useCareer";

const CourseGraph = dynamic(() => import("@/components/CourseGraph/CourseGraph"), {
  ssr: false,
});

export default function Dashboard() {
  const { t } = useTranslation('dashboard');
  const { ingest, getCourses, detectCycles, generatePlan } = useGraph();
  const [planResult, setPlanResult] = useState<PlanResult | null>(null);
  const [planError, setPlanError] = useState<string>("");
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("");
  const { listUniversities, listCareersByUniversity } = useUniversity();
  const { listCoursesByCareer } = useCareer();
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("");
  const [careerOptions, setCareerOptions] = useState<{ id: string; name: string }[]>([]);

  const algorithmOptions = useMemo(
    () => [
      {
        value: "",
        title: t("filters.algorithmOptions.auto.title", {
          defaultValue: "Automático",
        }),
        description: t("filters.algorithmOptions.auto.description", {
          defaultValue:
            "Deja que la plataforma elija el método más adecuado según tu selección.",
        }),
      },
      {
        value: "greedy",
        title: t("filters.algorithmOptions.greedy.title", {
          defaultValue: "Greedy",
        }),
        description: t("filters.algorithmOptions.greedy.description", {
          defaultValue:
            "Prioriza cursos con menor carga primero para liberar prerrequisitos rápidamente.",
        }),
      },
      {
        value: "critical_path",
        title: t("filters.algorithmOptions.critical_path.title", {
          defaultValue: "Ruta crítica",
        }),
        description: t("filters.algorithmOptions.critical_path.description", {
          defaultValue:
            "Ordena los cursos destacando los que desbloquean más asignaturas en el plan.",
        }),
      },
      {
        value: "topological",
        title: t("filters.algorithmOptions.topological.title", {
          defaultValue: "Topológico",
        }),
        description: t("filters.algorithmOptions.topological.description", {
          defaultValue:
            "Produce un orden clásico sin ciclos respetando al máximo los prerrequisitos.",
        }),
      },
      {
        value: "heuristic_v2",
        title: t("filters.algorithmOptions.heuristic_v2.title", {
          defaultValue: "Heurístico v2",
        }),
        description: t("filters.algorithmOptions.heuristic_v2.description", {
          defaultValue:
            "Combina heurísticas de créditos y prerrequisitos para balancear cada ciclo.",
        }),
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
    handleClearFilters,
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
  } = useDashboard();

  const coursesByCareer = useMemo(() => {
    return selectedCareer ? courses.filter((c: Course) => c.career === selectedCareer) : courses;
  }, [courses, selectedCareer]);

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
      setSelectedCareerValue("");
      if (!selectedUniversity) {
        setCareerOptions([]);
        return;
      }
      try {
        const list = await listCareersByUniversity(selectedUniversity);
        if (!active) return;
        setCareerOptions(list.map((c: ApiCareer) => ({ id: c.id, name: c.name })));
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
      const result = await generatePlan({
        courses,
        plannedCourseIds,
        creditLimit,
        algorithm: selectedAlgorithm || undefined,
      });
      console.debug("plan result", result);
      setPlanResult(result);
    } catch (e) {
      console.error("plan error", e);
      setPlanError(e instanceof Error ? e.message : "Unexpected error");
    }
  }, [courses, plannedCourseIds, creditLimit, generatePlan, selectedAlgorithm]);

  const handleResetDashboard = useCallback(() => {
    handleClearFilters();
    setPlanResult(null);
  }, [handleClearFilters]);

  useEffect(() => {
    const run = async () => {
      try {
        const ingested = await ingest({});
        console.log("ingest response", ingested?.length ?? 0);
        const coursesResp = await getCourses();
        console.log("courses response", coursesResp?.length ?? 0);
        const mapped: Course[] = (coursesResp || []).map((course) => ({
          id: course.code,
          name: course.name,
          credits: course.credits,
          cycle: course.cycle,
          prerequisites: course.prerequisites || [],
          status: "not_taken",
          career: course.career || undefined,
          university: course.university || undefined,
          program: course.program || undefined,
        }));
        setCoursesList(mapped);
        const cyclesResp = await detectCycles();
        console.log("detect-cycles response", cyclesResp);
      } catch (err) {
        console.error("graph api error", err);
      }
    };
    run();
  }, [ingest, getCourses, detectCycles, setCoursesList]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Header */}
      <DashboardHeader onLogout={handleLogout} />

      {/* Main Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Filters + Advanced */}
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
                    <p className="mt-2 text-xs text-red-600"> {t("filters.warning", {creditLimit})}</p>
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

            <div className="mt-4 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={handleResetDashboard}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 ease-out hover:scale-[1.03] hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 cursor-pointer"
              >
                <FiTrash2 className="h-4 w-4" />
                {t("button.delete")}
              </button>
              <button
                type="button"
                onClick={handleConfirmSelection}
                className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:scale-[1.03] hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/25 dark:hover:text-primary-foreground cursor-pointer"
              >
                <FiSave className="h-4 w-4" />
                {t("button.save")}
              </button>
            </div>
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
    </div>
  </div>
);
}
