import type { DashboardReport } from "../entities/dashboardReport";

export interface DashboardReportExporter {
  export(report: DashboardReport): Promise<void> | void;
}
