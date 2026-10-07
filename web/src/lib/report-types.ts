export const REPORT_TYPES = [
  { value: "observations", label: "Field observations" },
  { value: "species-catalogue", label: "Species catalogue" },
  { value: "conservation-status", label: "Conservation status" },
] as const;

export type ReportType = (typeof REPORT_TYPES)[number]["value"];