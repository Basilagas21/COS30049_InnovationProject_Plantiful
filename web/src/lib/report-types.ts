export const REPORT_TYPES = [
  { value: "observations", label: "Field observations" },
  { value: "species-catalogue", label: "Species catalogue" },
  { value: "conservation-status", label: "Conservation status" },
] as const;

export type ReportType = (typeof REPORT_TYPES)[number]["value"];

export const REPORT_FORMATS = [
  { value: "csv", label: "CSV (spreadsheet)" },
  { value: "pdf", label: "PDF (printable)" },
] as const;

export type ReportFormat = (typeof REPORT_FORMATS)[number]["value"];
