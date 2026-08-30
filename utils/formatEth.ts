import { formatEthiopianDate } from "@/lib/utils";
import { gregorianToEth, ETH_MONTHS } from "./ethiopianCalendar"

export function formatEth(date: Date) {
  const { year, month, day } = gregorianToEth(date)
  return `${day} ${ETH_MONTHS[month - 1]} ${year}`
}
// ✅ Helpers
export const parseDate = (value?: string) => (value ? new Date(value) : undefined);

// safer for backend (date-only apps)
export const toDateOnlyISO = (date: Date) =>
  date.toISOString().split("T")[0];

export function formatErrorDateMessage(message: string) {
    // Example: match dates like 2026-05-09 00:00:00
    return message.replace(
      /\d{4}-\d{2}-\d{2}/g,
      (match) => formatEthiopianDate(match) // convert each date to Ethiopian
    );
  }

 export const toDateOnly = (date: string) => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  };

/**
 * Ethiopian Date Name Utilities — Trilingual Edition
 * ────────────────────────────────────────────────────
 * Converts an ISO date string (or JS Date) into a fully named
 * Ethiopian date in three languages:
 *   • English  (transliterated)
 *   • Amharic  (አማርኛ  — Ethiopic script)
 *   • Oromiffa (Afaan Oromoo — Latin script)
 *
 * Ethiopian calendar facts:
 *  • 13 months: 12 × 30 days + Pagume / Qaam'ee (5–6 days)
 *  • ~7–8 years behind Gregorian
 *  • New Year (Enkutatash / Bara Haaraa) = 11 Sep Gregorian
 *    (12 Sep in years before a Gregorian leap year)
 *  • Week starts Sunday
 */

/* =========================================================
   MONTH DATA  (all 13 Ethiopian months)
   Oromo names sourced from:
     – ScriptSource Unicode CLDR (Afaan Oromoo locale)
     – Afaan Oromoo Online / Horn Affairs calendar articles
========================================================= */

export interface EthiopianMonthInfo {
  /** 1-based month index in the Ethiopian calendar */
  month: number;
  /** Transliterated English name (Ge'ez origin) */
  nameEn: string;
  /** Amharic script */
  nameAm: string;
  /** Afaan Oromoo (Latin script) */
  nameOr: string;
  /** Approximate Gregorian date range */
  gregorianApprox: string;
}

export const ETHIOPIAN_MONTHS: EthiopianMonthInfo[] = [
  // EC month 1  ≈ 11 Sep – 10 Oct
  { month: 1,  nameEn: "Meskerem", nameAm: "መስከረም", nameOr: "Fulbaana",     gregorianApprox: "Sep – Oct"         },
  // EC month 2  ≈ 11 Oct – 9 Nov
  { month: 2,  nameEn: "Tikimt",   nameAm: "ጥቅምት",  nameOr: "Onkololeessa", gregorianApprox: "Oct – Nov"         },
  // EC month 3  ≈ 10 Nov – 9 Dec
  { month: 3,  nameEn: "Hidar",    nameAm: "ህዳር",    nameOr: "Sadaasa",      gregorianApprox: "Nov – Dec"         },
  // EC month 4  ≈ 10 Dec – 8 Jan
  { month: 4,  nameEn: "Tahsas",   nameAm: "ታህሳስ",  nameOr: "Mudde",        gregorianApprox: "Dec – Jan"         },
  // EC month 5  ≈ 9 Jan – 7 Feb
  { month: 5,  nameEn: "Tir",      nameAm: "ጥር",     nameOr: "Amajjii",      gregorianApprox: "Jan – Feb"         },
  // EC month 6  ≈ 8 Feb – 9 Mar
  { month: 6,  nameEn: "Yekatit",  nameAm: "የካቲት",  nameOr: "Guraandhala",  gregorianApprox: "Feb – Mar"         },
  // EC month 7  ≈ 10 Mar – 8 Apr
  { month: 7,  nameEn: "Megabit",  nameAm: "መጋቢት",  nameOr: "Bitooteessa",  gregorianApprox: "Mar – Apr"         },
  // EC month 8  ≈ 9 Apr – 8 May
  { month: 8,  nameEn: "Miazia",   nameAm: "ሚያዚያ",  nameOr: "Ebla",         gregorianApprox: "Apr – May"         },
  // EC month 9  ≈ 9 May – 7 Jun
  { month: 9,  nameEn: "Ginbot",   nameAm: "ግንቦት",  nameOr: "Caamsaa",      gregorianApprox: "May – Jun"         },
  // EC month 10 ≈ 8 Jun – 7 Jul
  { month: 10, nameEn: "Sene",     nameAm: "ሰኔ",    nameOr: "Waxabajjii",   gregorianApprox: "Jun – Jul"         },
  // EC month 11 ≈ 8 Jul – 6 Aug
  { month: 11, nameEn: "Hamle",    nameAm: "ሐምሌ",   nameOr: "Adooleessa",   gregorianApprox: "Jul – Aug"         },
  // EC month 12 ≈ 7 Aug – 5 Sep
  { month: 12, nameEn: "Nehase",   nameAm: "ነሐሴ",   nameOr: "Hagayya",      gregorianApprox: "Aug – Sep"         },
  // EC month 13 ≈ 6–10 Sep  (5 or 6 epagomenal days)
  { month: 13, nameEn: "Pagume",   nameAm: "ጳጉሜ",   nameOr: "Qaam'ee",      gregorianApprox: "Sep (5–6 days)"    },
];

/* =========================================================
   DAY-OF-WEEK DATA
   Oromo sources: ScriptSource Unicode CLDR + Afaan Oromoo
   Online calendar reference
========================================================= */

export interface EthiopianDayInfo {
  /** 0 = Sunday … 6 = Saturday (JS getDay() convention) */
  dayIndex: number;
  nameEn:   string;
  nameAm:   string;
  nameOr:   string;
}

export const ETHIOPIAN_DAYS: EthiopianDayInfo[] = [
  { dayIndex: 0, nameEn: "Ehud",     nameAm: "እሑድ",   nameOr: "Dilbata"  },
  { dayIndex: 1, nameEn: "Segno",    nameAm: "ሰኞ",    nameOr: "Wiixata"  },
  { dayIndex: 2, nameEn: "Maksegno", nameAm: "ማክሰኞ",  nameOr: "Kibxata"  },
  { dayIndex: 3, nameEn: "Rob",      nameAm: "ረቡዕ",   nameOr: "Roobii"   },
  { dayIndex: 4, nameEn: "Hamus",    nameAm: "ሐሙስ",   nameOr: "Kamiisa"  },
  { dayIndex: 5, nameEn: "Arb",      nameAm: "አርብ",   nameOr: "Jimaata"  },
  { dayIndex: 6, nameEn: "Kidame",   nameAm: "ቅዳሜ",   nameOr: "Sanbata"  },
];

/* =========================================================
   SCRIPT TYPE
========================================================= */

export type EthiopianScript = "en" | "am" | "or";

/* =========================================================
   CORE CONVERSION: Gregorian → Ethiopian (JDN-based)
========================================================= */

export interface EthiopianDate {
  year:  number;
  month: number;
  day:   number;
}

/** Convert a Gregorian JS Date to an Ethiopian calendar date. */
export function toEthiopianDate(gregorian: Date): EthiopianDate {
  const jdn = gregorianToJDN(
    gregorian.getFullYear(),
    gregorian.getMonth() + 1,
    gregorian.getDate()
  );
  return jdnToEthiopian(jdn);
}

function gregorianToJDN(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

function jdnToEthiopian(jdn: number): EthiopianDate {
  const ETHIOPIAN_EPOCH = 1724221; // JDN of Meskerem 1, 1 EC
  const r     = (jdn - ETHIOPIAN_EPOCH) % 1461;
  const n     = (r % 365) + 365 * Math.floor(r / 1460);
  const year  = 4 * Math.floor((jdn - ETHIOPIAN_EPOCH) / 1461) + Math.floor(r / 365) - Math.floor(r / 1460) + 1; // +1: epoch counts from year 1, not 0
  const month = Math.floor(n / 30) + 1;
  const day   = (n % 30) + 1;
  return { year, month, day };
}

/* =========================================================
   NAMED DATE RESULT
========================================================= */

export interface EthiopianDateName {
  /* ── Numeric ─────────────────── */
  year:  number;
  month: number;
  day:   number;

  /* ── Month ───────────────────── */
  monthNameEn: string;
  monthNameAm: string;
  monthNameOr: string;
  gregorianApprox: string;

  /* ── Day of week ─────────────── */
  dayOfWeekEn: string;
  dayOfWeekAm: string;
  dayOfWeekOr: string;

  /* ── Pre-formatted display strings ─────────────────── */
  /** "Meskerem 15, 2017"               */ shortEn: string;
  /** "15 መስከረም 2017"                  */ shortAm: string;
  /** "Fulbaana 15, 2017"               */ shortOr: string;

  /** "Segno, Meskerem 15, 2017"        */ longEn: string;
  /** "ሰኞ፣ 15 መስከረም 2017"             */ longAm: string;
  /** "Wiixata, Fulbaana 15, 2017"      */ longOr: string;

  /** "Q1 • Meskerem • 2017"            */ periodLabelEn: string;
  /** "Q1 • መስከረም • 2017"             */ periodLabelAm: string;
  /** "Q1 • Fulbaana • 2017"            */ periodLabelOr: string;
}

/* =========================================================
   MAIN API
========================================================= */

/**
 * Get a fully named, trilingual Ethiopian date from any
 * ISO date string ("YYYY-MM-DD") or JS Date.
 *
 * @example
 * getEthiopianDateName("2024-09-22")
 * // {
 * //   shortEn: "Meskerem 12, 2017",
 * //   shortOr: "Fulbaana 12, 2017",
 * //   shortAm: "12 መስከረም 2017",
 * //   dayOfWeekOr: "Wiixata",
 * //   ...
 * // }
 */
export function getEthiopianDateName(input: string | Date): EthiopianDateName {
  const gregorian =
    typeof input === "string"
      ? new Date(input + (input.length === 10 ? "T00:00:00" : ""))
      : input;

  const eth       = toEthiopianDate(gregorian);
  const monthInfo = ETHIOPIAN_MONTHS[eth.month - 1];
  const dayInfo   = ETHIOPIAN_DAYS[gregorian.getDay()];
  const quarter   = Math.ceil(eth.month / 3);

  return {
    year:  eth.year,
    month: eth.month,
    day:   eth.day,

    monthNameEn: monthInfo.nameEn,
    monthNameAm: monthInfo.nameAm,
    monthNameOr: monthInfo.nameOr,
    gregorianApprox: monthInfo.gregorianApprox,

    dayOfWeekEn: dayInfo.nameEn,
    dayOfWeekAm: dayInfo.nameAm,
    dayOfWeekOr: dayInfo.nameOr,

    shortEn: `${monthInfo.nameEn} ${eth.day}, ${eth.year}`,
    shortAm: `${eth.day} ${monthInfo.nameAm} ${eth.year}`,
    shortOr: `${monthInfo.nameOr} ${eth.day}, ${eth.year}`,

    longEn: `${dayInfo.nameEn}, ${monthInfo.nameEn} ${eth.day}, ${eth.year}`,
    longAm: `${dayInfo.nameAm}፣ ${eth.day} ${monthInfo.nameAm} ${eth.year}`,
    longOr: `${dayInfo.nameOr}, ${monthInfo.nameOr} ${eth.day}, ${eth.year}`,

    periodLabelEn: `Q${quarter} • ${monthInfo.nameEn} • ${eth.year}`,
    periodLabelAm: `Q${quarter} • ${monthInfo.nameAm} • ${eth.year}`,
    periodLabelOr: `Q${quarter} • ${monthInfo.nameOr} • ${eth.year}`,
  };
}

/* =========================================================
   CONVENIENCE WRAPPERS
========================================================= */

/**
 * Get only the Ethiopian month name in the requested language.
 * @param script  "en" | "am" | "or"  (default: "en")
 */
export function getEthiopianMonthName(
  input: string | Date,
  script: EthiopianScript = "en"
): string {
  const d = getEthiopianDateName(input);
  if (script === "am") return d.monthNameAm;
  if (script === "or") return d.monthNameOr;
  return d.monthNameEn;
}

/**
 * Get only the day-of-week name in the requested language.
 * @param script  "en" | "am" | "or"  (default: "en")
 */
export function getEthiopianDayName(
  input: string | Date,
  script: EthiopianScript = "en"
): string {
  const d = getEthiopianDateName(input);
  if (script === "am") return d.dayOfWeekAm;
  if (script === "or") return d.dayOfWeekOr;
  return d.dayOfWeekEn;
}

/**
 * Format an ISO date range as a human-readable Ethiopian range string.
 *
 * @example
 * formatEthiopianRange("2024-09-22", "2024-10-21", "or")
 * // → "Fulbaana 12 – Onkololeessa 11, 2017"
 *
 * formatEthiopianRange("2024-09-22", "2024-10-21", "am")
 * // → "12 መስከረም – 11 ጥቅምት 2017"
 */
export function formatEthiopianRange(
  startIso: string,
  endIso:   string,
  script: EthiopianScript = "en"
): string {
  const s = getEthiopianDateName(startIso);
  const e = getEthiopianDateName(endIso);
  const sameYear = s.year === e.year;

  if (script === "am") {
    return sameYear
      ? `${s.day} ${s.monthNameAm} – ${e.day} ${e.monthNameAm} ${e.year}`
      : `${s.shortAm} – ${e.shortAm}`;
  }

  if (script === "or") {
    return sameYear
      ? `${s.monthNameOr} ${s.day} – ${e.monthNameOr} ${e.day}, ${e.year}`
      : `${s.shortOr} – ${e.shortOr}`;
  }

  // "en" default
  return sameYear
    ? `${s.monthNameEn} ${s.day} – ${e.monthNameEn} ${e.day}, ${e.year}`
    : `${s.shortEn} – ${e.shortEn}`;
}

/**
 * Get a short formatted date in a specific language.
 * Convenience for inline display.
 *
 * @example
 * formatEthiopianDate("2024-09-22", "or")  // "Fulbaana 12, 2017"
 * formatEthiopianDate("2024-09-22", "am")  // "12 መስከረም 2017"
 * formatEthiopianDate("2024-09-22", "en")  // "Meskerem 12, 2017"
 */
// export function formatEthiopianDate(
//   input: string | Date,
//   script: EthiopianScript = "en"
// ): string {
//   const d = getEthiopianDateName(input);
//   if (script === "am") return d.shortAm;
//   if (script === "or") return d.shortOr;
//   return d.shortEn;
// }