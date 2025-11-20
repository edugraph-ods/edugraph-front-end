import React from "react";
import { useTranslation } from "react-i18next";

export const CoursePanelLegend: React.FC = () => {
  const { t } = useTranslation("dashboard");
  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-foreground">{t("graph.title")}</h3>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-green-100 dark:bg-green-900 border border-green-300 dark:border-green-600 rounded-full mr-2"></div>
        <span className="text-sm text-foreground">{t("graph.approved")}</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-600 rounded-full mr-2"></div>
        <span className="text-sm text-foreground">{t("graph.failed")}</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-muted border border-border rounded-full mr-2"></div>
        <span className="text-sm text-foreground">{t("graph.not_taken")}</span>
      </div>
      <div className="flex items-center">
        <div className="w-3 h-3 bg-primary/10 border-2 border-primary rounded-full mr-2"></div>
        <span className="text-sm text-foreground">{t("graph.critical")}</span>
      </div>
    </div>
  );
};
