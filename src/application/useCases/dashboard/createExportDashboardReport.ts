import type { DashboardReport } from "@/domain/entities/dashboardReport";
import type { DashboardReportExporter } from "@/domain/services/DashboardReportExporter";
import type { BuildDashboardReportInput } from "./createBuildDashboardReport";

export interface ExportDashboardReportDependencies {
  buildReport: (input: BuildDashboardReportInput) => DashboardReport;
  exporter: DashboardReportExporter;
}

export const createExportDashboardReport = ({
  buildReport,
  exporter,
}: ExportDashboardReportDependencies) => {
  return async (input: BuildDashboardReportInput) => {
    const report = buildReport(input);
    await Promise.resolve(exporter.export(report));
    return report;
  };
};
