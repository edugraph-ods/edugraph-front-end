import { jsPDF } from "jspdf";
import type { DashboardReportCourse, DashboardReportLabels } from "@/features/shared/domain/entities/dashboardReport";
import type { DashboardReportExporter } from "@/features/shared/domain/services/DashboardReportExporter";
import type { CourseStatus } from "@/features/education/courses/domain/entities/course";

const DEFAULT_LABELS: DashboardReportLabels = {
  title: "Reporte académico",
  summaryTitle: "Resumen",
  generatedAt: "Generado el",
  university: "Universidad",
  career: "Carrera",
  creditLimit: "Límite de créditos",
  totalPlannedCredits: "Créditos planificados",
  statusTotalsTitle: "Estados",
  plannedCoursesTitle: "Cursos planificados",
  allCoursesTitle: "Todos los cursos",
  planTitle: "Plan sugerido",
  planCyclePrefix: "Ciclo",
  progressTitle: "Estimación de culminación",
  progressCycles: "Ciclos",
  progressMonths: "Meses",
  progressYears: "Años",
  plannedBadge: "Planificado",
  notPlannedBadge: "No planificado",
  columns: {
    course: "Curso",
    credits: "Créditos",
    cycle: "Ciclo",
    status: "Estado",
  },
  statusLabels: {
    approved: "Aprobado",
    failed: "Desaprobado",
    not_taken: "No cursado",
  },
};

const mergeLabels = (labels?: DashboardReportLabels): DashboardReportLabels => {
  if (!labels) {
    return DEFAULT_LABELS;
  }

  return {
    ...DEFAULT_LABELS,
    ...labels,
    columns: {
      ...DEFAULT_LABELS.columns,
      ...(labels.columns ?? {}),
    },
    statusLabels: {
      ...DEFAULT_LABELS.statusLabels,
      ...(labels.statusLabels ?? {}),
    },
  } satisfies DashboardReportLabels;
};

const sortCoursesByCycle = (courses: DashboardReportCourse[]): DashboardReportCourse[] => {
  return [...courses].sort((a, b) => {
    if (a.cycle !== b.cycle) {
      return a.cycle - b.cycle;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
};

export const createJspdfDashboardReportExporter = (): DashboardReportExporter => {
  return {
    export(report) {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const labels = mergeLabels(report.labels);

      const marginLeft = 15;
      const marginTop = 20;
      const marginBottom = 20;
      const pageHeight = doc.internal.pageSize.getHeight();
      const lineHeight = 6;
      let cursorY = marginTop;

      const ensureSpace = (height = lineHeight) => {
        if (cursorY + height > pageHeight - marginBottom) {
          doc.addPage();
          cursorY = marginTop;
        }
      };

      const setFont = (style: "normal" | "bold", size: number) => {
        doc.setFont("helvetica", style);
        doc.setFontSize(size);
      };

      const addText = (text: string, options?: { style?: "normal" | "bold"; size?: number; spacing?: number }) => {
        const { style = "normal", size = 11, spacing = lineHeight } = options ?? {};
        ensureSpace(spacing);
        setFont(style, size);
        doc.text(text, marginLeft, cursorY);
        cursorY += spacing;
      };

      const addKeyValue = (label: string, value?: string | number | null) => {
        if (value === undefined || value === null || value === "") {
          return;
        }
        addText(`${label}: ${value}`, { size: 10 });
      };

      const addStatusTotals = () => {
        addText(labels.statusTotalsTitle ?? DEFAULT_LABELS.statusTotalsTitle!, { style: "bold", size: 12, spacing: lineHeight + 1 });
        (Object.keys(report.statusTotals) as CourseStatus[]).forEach((statusKey) => {
          const statusLabel = labels.statusLabels?.[statusKey] ?? DEFAULT_LABELS.statusLabels?.[statusKey] ?? statusKey;
          addText(`• ${statusLabel}: ${report.statusTotals[statusKey]}`, { size: 10 });
        });
      };

      const columnX = {
        course: marginLeft,
        credits: marginLeft + 105,
        cycle: marginLeft + 130,
        status: marginLeft + 155,
      } as const;

      const addCourseTable = (title: string, courses: DashboardReportCourse[]) => {
        if (!courses.length) {
          return;
        }

        addText(title, { style: "bold", size: 12, spacing: lineHeight + 1 });
        ensureSpace(lineHeight);
        setFont("bold", 10);
        doc.text(labels.columns?.course ?? DEFAULT_LABELS.columns!.course!, columnX.course, cursorY);
        doc.text(labels.columns?.credits ?? DEFAULT_LABELS.columns!.credits!, columnX.credits, cursorY);
        doc.text(labels.columns?.cycle ?? DEFAULT_LABELS.columns!.cycle!, columnX.cycle, cursorY);
        doc.text(labels.columns?.status ?? DEFAULT_LABELS.columns!.status!, columnX.status, cursorY);
        cursorY += lineHeight;

        setFont("normal", 10);
        sortCoursesByCycle(courses).forEach((course) => {
          const statusLabel = labels.statusLabels?.[course.status] ?? DEFAULT_LABELS.statusLabels?.[course.status] ?? course.status;
          const plannedSuffix = course.isPlanned ? ` (${labels.plannedBadge ?? DEFAULT_LABELS.plannedBadge})` : "";
          const statusText = `${statusLabel}${plannedSuffix}`;
          const displayName = course.name || course.id;
          const nameLines = doc.splitTextToSize(displayName, 100);
          const rowHeight = Math.max(lineHeight, nameLines.length * lineHeight);
          ensureSpace(rowHeight + 1.5);
          nameLines.forEach((line: string, idx: number) => {
            doc.text(line, columnX.course, cursorY + idx * lineHeight);
          });
          doc.text(String(course.credits), columnX.credits, cursorY);
          doc.text(String(course.cycle), columnX.cycle, cursorY);
          doc.text(statusText, columnX.status, cursorY);
          cursorY += rowHeight;
        });
        cursorY += lineHeight / 2;
      };

      const addPlanSection = () => {
        if (!report.plan) {
          return;
        }

        addText(labels.planTitle ?? DEFAULT_LABELS.planTitle!, { style: "bold", size: 12, spacing: lineHeight + 1 });
        addText(`${labels.planCyclePrefix ?? DEFAULT_LABELS.planCyclePrefix!}s totales: ${report.plan.totalCycles}`, { size: 10 });
        report.plan.cycles.forEach((cycle) => {
          const title = `${labels.planCyclePrefix ?? DEFAULT_LABELS.planCyclePrefix!} ${cycle.cycle} • ${cycle.totalCredits} ${labels.columns?.credits ?? DEFAULT_LABELS.columns!.credits!}`;
          addText(title, { style: "bold", size: 10 });
          const names = cycle.courses.map((course) => course.name ?? course.id).join(", ");
          const lines = doc.splitTextToSize(names || "-", 170);
          const blockHeight = Math.max(lineHeight, lines.length * lineHeight);
          ensureSpace(blockHeight + 1);
          lines.forEach((line: string, idx: number) => {
            doc.text(`• ${line}`, marginLeft, cursorY + idx * lineHeight);
          });
          cursorY += blockHeight;
        });
        cursorY += lineHeight / 2;
      };

      const addProgressSection = () => {
        if (!report.progressEstimate) {
          return;
        }

        addText(labels.progressTitle ?? DEFAULT_LABELS.progressTitle!, { style: "bold", size: 12, spacing: lineHeight + 1 });
        addText(`${labels.progressCycles ?? DEFAULT_LABELS.progressCycles!}: ${report.progressEstimate.cyclesNeeded}`, { size: 10 });
        addText(`${labels.progressMonths ?? DEFAULT_LABELS.progressMonths!}: ${report.progressEstimate.monthsNeeded}`, { size: 10 });
        addText(`${labels.progressYears ?? DEFAULT_LABELS.progressYears!}: ${report.progressEstimate.yearsNeeded}`, { size: 10 });
        cursorY += lineHeight / 2;
      };

      const generatedDate = new Date(report.generatedAt);
      const generatedAtLabel = Number.isNaN(generatedDate.getTime())
        ? report.generatedAt
        : generatedDate.toLocaleString();

      addText(labels.title ?? DEFAULT_LABELS.title!, { style: "bold", size: 16, spacing: lineHeight + 2 });
      addText(labels.summaryTitle ?? DEFAULT_LABELS.summaryTitle!, { style: "bold", size: 12 });
      addKeyValue(labels.generatedAt ?? DEFAULT_LABELS.generatedAt!, generatedAtLabel);
      addKeyValue(labels.university ?? DEFAULT_LABELS.university!, report.universityName);
      addKeyValue(labels.career ?? DEFAULT_LABELS.career!, report.careerName);
      addKeyValue(labels.creditLimit ?? DEFAULT_LABELS.creditLimit!,
        typeof report.creditLimit === "number" && report.creditLimit > 0 ? report.creditLimit : undefined);
      addKeyValue(labels.totalPlannedCredits ?? DEFAULT_LABELS.totalPlannedCredits!, report.totalPlannedCredits);
      cursorY += lineHeight / 2;

      addStatusTotals();
      cursorY += lineHeight / 2;

      addCourseTable(labels.plannedCoursesTitle ?? DEFAULT_LABELS.plannedCoursesTitle!, report.plannedCourses);
      addCourseTable(labels.allCoursesTitle ?? DEFAULT_LABELS.allCoursesTitle!, report.courses);
      addPlanSection();
      addProgressSection();

      const fileDate = Number.isNaN(generatedDate.getTime())
        ? new Date()
        : generatedDate;
      const fileName = `edugraph-dashboard-${fileDate.toISOString().slice(0, 10)}.pdf`;
      doc.save(fileName);
    },
  } satisfies DashboardReportExporter;
};
