"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { FiChevronDown, FiUser, FiLogOut, FiChevronUp } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { CourseStatus, Course } from "@/hooks/use-course";
import { useDashboard } from "@/hooks/useDashboard";
import { useGraphApi } from "@/hooks/use-graph";
import { ThemeToggle } from "@/components/theme-provider";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from 'react-i18next';
import { getToken } from "@/lib/api-client";

interface DecodedTokenPayload {
  full_name?: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

const decodePayload = <T,>(token: string): T | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = typeof window === "undefined"
      ? Buffer.from(payload, "base64").toString("utf-8")
      : atob(payload);
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
};

const getUserInfo = (): DecodedTokenPayload | null => {
  const token = getToken();
  if (!token) return null;
  return decodePayload<DecodedTokenPayload>(token);
};

const CourseGraph = dynamic(() => import("@/components/CourseGraph/CourseGraph"), {
  ssr: false,
});

export default function Dashboard() {
  const router = useRouter();
  const { t } = useTranslation('dashboard');
  const { ingest, getCourses, detectCycles, plan } = useGraphApi();
  const [planResult, setPlanResult] = useState<{ total_cycles: number; cycles: { cycle: number; total_credits: number; courses: string[] }[] } | null>(null);
  const [planError, setPlanError] = useState<string>("");
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string>("");

  const {
    selectedCycle,
    selectedCareer,
    selectedCourseId,
    expandedCycles,
    filteredCourses,
    handleCareerChange,
    handleClearFilters,
    handleLogout,
    toggleCycle,
    handleSelectCycle,
    updateCourseStatus,
    handleCourseSelect,
    toggleCourseStatus,
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
  } = useDashboard();

  const coursesByCareer = useMemo(() => {
    return selectedCareer ? courses.filter((c: Course) => c.career === selectedCareer) : courses;
  }, [courses, selectedCareer]);

  const handleStatusChange = useCallback(
    (courseId: string, newStatus: CourseStatus) => {
      updateCourseStatus(courseId, newStatus);
    },
    [updateCourseStatus]
  );

  const handleConfirmSelection = useCallback(async () => {
    try {
      setPlanError("");
      if (typeof creditLimit !== "number" || creditLimit <= 0) {
        setPlanError("Ingrese un límite de créditos válido");
        return;
      }
      const approved = courses.filter((c: Course) => c.status === "approved").map((c: Course) => c.id);
      const failures = courses.reduce((acc: Record<number, string[]>, c: Course) => {
        if (c.status === "failed") {
          const k = c.cycle;
          acc[k] = acc[k] ? [...acc[k], c.id] : [c.id];
        }
        return acc;
      }, {} as Record<number, string[]>);
      const target = plannedCourseIds.length ? plannedCourseIds : undefined;
      const payload: any = {
        max_credits: creditLimit as number,
        approved,
        target_codes: target,
        failures: Object.keys(failures).length ? failures : undefined,
      };
      if (selectedAlgorithm) {
        payload.algorithm = selectedAlgorithm;
      }
      console.debug("plan payload", payload);
      const result = await plan(payload);
      console.debug("plan result", result);
      setPlanResult(result);
    } catch (e) {
      console.error("plan error", e);
      setPlanError(e instanceof Error ? e.message : "Unexpected error");
    }
  }, [courses, plannedCourseIds, creditLimit, plan, selectedAlgorithm]);

  useEffect(() => {
    const run = async () => {
      try {
        const ingested = await ingest({});
        console.log("ingest response", ingested?.length ?? 0);
        const coursesResp = await getCourses();
        console.log("courses response", coursesResp?.length ?? 0);
        const mapped: Course[] = (coursesResp || []).map((c) => ({
          id: c.code,
          name: c.name,
          credits: c.credits,
          cycle: c.cycle,
          prerequisites: c.prerequisites || [],
          status: "not_taken",
          career: c.career || undefined,
          university: c.university || undefined,
          program: c.program || undefined,
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

  const [userInfo, setUserInfo] = useState<DecodedTokenPayload | null>(null);

  useEffect(() => {
    setUserInfo(getUserInfo());
  }, []);

  const tooltipContent = useMemo(() => {
    if (!userInfo) {
      return (
        <div className="px-4 py-3 text-sm text-muted-foreground">
          {t("header.noUser", { defaultValue: "Sesión no identificada." })}
        </div>
      );
    }

    const { full_name, name, email } = userInfo;

    return (
      <div className="px-4 py-3 w-56">
        <p className="text-sm font-semibold text-foreground">
          {full_name ?? name ?? t("header.anonymous", { defaultValue: "Usuario" })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground break-words">
          {email ?? "user@example.com"}
        </p>
      </div>
    );
  }, [t, userInfo]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-card shadow-sm border-b border-border">
        <div className="flex items-center space-x-4">
          <img
            src="/logo.jpg"
            alt="EduGraph Logo"
            className="h-8 w-8 rounded-full border border-border"
          />
          <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          <ThemeToggle />
          <div className="relative">
            <div className="flex items-center space-x-2 cursor-pointer group peer">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <FiUser className="text-secondary-foreground" />
              </div>
              <FiChevronDown className="group-hover:rotate-180 transition-transform text-muted-foreground" />
            </div>
            <div className="pointer-events-none opacity-0 peer-hover:opacity-100 peer-hover:pointer-events-auto transition-opacity duration-150 absolute right-0 mt-2 w-max z-10">
              <div className="bg-popover text-popover-foreground border border-border rounded-md shadow-lg">
                {tooltipContent}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <FiLogOut size={20} className="text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </header>

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
                  className="text-sm px-2 py-1 rounded border border-input hover:bg-accent"
                >
                  {filtersCollapsed ? t("hide.show", { defaultValue: "Mostrar" }) : t("hide.hide", { defaultValue: "Ocultar" })}
                </button>
              </div>
              {!filtersCollapsed && (
                <div className="p-6 pt-4">
                
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
                    {(careers.length ? careers : CAREERS).map((career) => (
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
                    className={`mt-3 w-full px-3 py-2 rounded text-sm font-medium transition-colors ${
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
                <h2 className="text-lg font-semibold">{t("filters.advanced", { defaultValue: "Configuración avanzada" })}</h2>
                <button
                  onClick={() => setAdvancedOpen((v) => !v)}
                  className="text-sm px-2 py-1 rounded border border-input hover:bg-accent"
                >
                  {advancedOpen ? t("hide.hide", { defaultValue: "Ocultar" }) : t("hide.show", { defaultValue: "Mostrar" })}
                </button>
              </div>
              {advancedOpen && (
                <div className="p-6 pt-0 space-y-3">
                  <div>
                    <label htmlFor="algorithm" className="block text-sm font-medium text-foreground">{t("filters.algorithm", { defaultValue: "Algoritmo" })}</label>
                    <select
                      id="algorithm"
                      value={selectedAlgorithm}
                      onChange={(e) => setSelectedAlgorithm(e.target.value)}
                      className="w-full p-2 text-sm border border-input bg-background rounded-md"
                    >
                      <option value="">{t("filters.algorithm.auto", { defaultValue: "Automático" })}</option>
                      <option value="greedy">Greedy</option>
                      <option value="critical_path">Critical Path</option>
                      <option value="topological">Topological</option>
                      <option value="heuristic_v2">Heuristic v2</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Graph */}
        <div className="lg:col-span-3 bg-card rounded-xl p-6 shadow-sm border border-border" style={{ height: 'calc(100vh - 120px)', minHeight: 0 }}>
          <div className="h-full flex flex-col" style={{ minHeight: 0 }}>
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
