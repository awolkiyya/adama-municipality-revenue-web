import { Frequency, FrequencyConfigMap } from "@/types/commen";

export const DEFAULT_FREQUENCY_CONFIG: FrequencyConfigMap = {
  daily: {
    size: 7,
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },

  weekly: {
    size: 52,
    labels: Array.from({ length: 52 }, (_, i) => `W${i + 1}`),
  },

  monthly: {
    size: 12,
    labels: [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ],
  },

  quarterly: {
    size: 4,
    labels: ["Q1", "Q2", "Q3", "Q4"],
  },

  half_year: {
    size: 2,
    labels: ["H1", "H2"],
  },

  yearly: {
    size: 1,
    labels: ["Year"],
  },
};

/* ===============================
   SAFE CONFIG RESOLVER
================================= */
const resolveConfig = (config?: FrequencyConfigMap) => {
  return config ?? DEFAULT_FREQUENCY_CONFIG;
};

/* ===============================
   SIZE (SAFE - NO 0 FALLBACK)
================================= */
export const getAllocationSize = (
  frequency: Frequency,
  config?: FrequencyConfigMap
): number => {
  const safe = resolveConfig(config);

  const entry = safe[frequency];

  if (!entry) {
    throw new Error(`Missing allocation config for frequency: ${frequency}`);
  }

  return entry.size;
};

/* ===============================
   LABELS (SAFE)
================================= */
export const getAllocationLabels = (
  frequency: Frequency,
  config?: FrequencyConfigMap
): string[] => {
  const safe = resolveConfig(config);

  return safe[frequency]?.labels ?? [];
};

/* ===============================
   GRID LAYOUT (UI ONLY)
================================= */
export const getGridCols = (frequency: Frequency): string => {
  switch (frequency) {
    case "yearly":
      return "grid-cols-1";

    case "quarterly":
      return "grid-cols-4";

    case "monthly":
      return "grid-cols-3 md:grid-cols-6";

    default:
      return "grid-cols-3";
  }
};

export const getQuarterIndex = (i: number): "q1" | "q2" | "q3" | "q4" => {
    if (i < 3) return "q1";
    if (i < 6) return "q2";
    if (i < 9) return "q3";
    return "q4";
  };