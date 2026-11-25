export const REPORT_TYPES = [
  {
    value: "observations",
    label: "Field observations",
    description: "Records with GPS, taxonomy, approval status, morphology and field notes.",
  },
  {
    value: "species-catalogue",
    label: "Species catalogue",
    description: "The verified species list with names, conservation status and descriptions.",
  },
  {
    value: "conservation-status",
    label: "Conservation status",
    description: "A compact status view for review meetings and partner reporting.",
  },
] as const;

export type ReportType = (typeof REPORT_TYPES)[number]["value"];

export const REPORT_FORMATS = [
  { value: "csv", label: "CSV (spreadsheet)" },
  { value: "pdf", label: "PDF (printable)" },
] as const;

export type ReportFormat = (typeof REPORT_FORMATS)[number]["value"];
