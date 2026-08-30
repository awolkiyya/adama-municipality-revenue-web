import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("authToken");
};

export const setToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("authToken", token);
};

export const removeToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("authToken");
};
// userStorage.ts

export const USER_KEY = "user";

export function saveUserToLocalStorage(user: object) {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Failed to save user to localStorage", error);
  }
}

export function getUserFromLocalStorage() {
  try {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;
    return JSON.parse(userJson);
  } catch (error) {
    console.error("Failed to parse user from localStorage", error);
    return null;
  }
}

export function removeUserFromLocalStorage() {
  try {
    localStorage.removeItem(USER_KEY);
  } catch (error) {
    console.error("Failed to remove user from localStorage", error);
  }
}
import ethiopianDate, { toEthiopian } from "ethiopian-date";
import { Invoice } from "@/components/citizen/types";

/**
 * Get today's date converted to Ethiopian calendar
 * @returns {{ year: number; month: number; day: number }} Ethiopian date parts
 */
export function getTodayInEthiopian(): { year: number; month: number; day: number } {
  const today = new Date();
  const [year, month, day] = ethiopianDate.toEthiopian(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );
  return { year, month, day };
}

/**
 * Get today's Ethiopian date formatted as YYYY-MM-DD string
 * @returns {string} Ethiopian date string in format 'YYYY-MM-DD'
 */
export function getTodayEthiopianStr(): string {
  const { year, month, day } = getTodayInEthiopian();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Convert Ethiopian date to Gregorian Date object
 * @param {number} year Ethiopian year
 * @param {number} month Ethiopian month (1-13)
 * @param {number} day Ethiopian day
 * @returns {Date} Gregorian Date object corresponding to Ethiopian date
 */
export function ethiopianToGregorianDate(year: number, month: number, day: number): Date {
  const [gy, gm, gd] = ethiopianDate.toGregorian(year, month, day);
  return new Date(gy, gm - 1, gd);
}

/**
 * Convert Gregorian Date object to Ethiopian date array [year, month, day]
 * @param {Date} date JavaScript Date object
 * @returns {[number, number, number]} Ethiopian date parts [year, month, day]
 */
export function gregorianToEthiopian(date: Date): [number, number, number] {
  return ethiopianDate.toEthiopian(date.getFullYear(), date.getMonth() + 1, date.getDate());
}



// the things needed for the plan logic 
export type PlanType = "yearly" | "quarterly";

// Format date to yyyy-mm-dd for input[type=date]
export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

// Convert Ethiopian date (year, month, day) to Gregorian Date using ethiopian-date package
export function ethiopianToGregorian(ethYear: number, ethMonth: number, ethDay: number): Date {
  const [gy, gm, gd] = ethiopianDate.toGregorian(ethYear, ethMonth, ethDay);
  return new Date(gy, gm - 1, gd); // JS months are zero-based
}

// Get number of days in Pagumen month (5 normally, 6 if next Gregorian year is leap)
export function getPagumenDays(ethYear: number) {
  const [gy] = ethiopianDate.toGregorian(ethYear + 1, 1, 1);
  return (gy % 4 === 0 && (gy % 100 !== 0 || gy % 400 === 0)) ? 6 : 5;
}

export function getEthiopianDate(dateInput: string | Date) {
  // 🔥 FORCE UTC PARSING SAFELY
  const date = new Date(
    typeof dateInput === "string" && !dateInput.endsWith("Z")
      ? dateInput + "Z"
      : dateInput
  );

  if (isNaN(date.getTime())) {
    return null;
  }

  const [year, month, day] = toEthiopian(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );

  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Addis_Ababa",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);

  return {
    day,
    month,
    year,
    time,
  };
}

export function formatEthiopianDate(dateInput: string | Date): string {
  const et = getEthiopianDate(dateInput);

  if (!et) return "-";

  return `${et.day}/${et.month}/${et.year}`;
}

export const formatEthiopianDateWithTime = (dateInput: string | Date): string => {
  const et = getEthiopianDate(dateInput);

  if (!et) return "-";

  return `${et.day}/${et.month}/${et.year} ${et.time ?? ""}`.trim();
};


export function formatEthiopianRange(start: string, end: string) {
  return `${formatEthiopianDate(start)} → ${formatEthiopianDate(end)}`;
}

// Utility to get current Ethiopian year
export function getCurrentEthiopianYear(): number {
  const today = new Date();
  const [year] = ethiopianDate.toEthiopian(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );
  return year;
}

// Utility to get current Ethiopian month (1-13)
export function getCurrentEthiopianMonth(): number {
  const today = new Date();
  const [, month] = ethiopianDate.toEthiopian(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );
  return month;
}
export const ethiopianMonths = [
  "Meskerem",
  "Tikimt",
  "Hidar",
  "Tahsas",
  "Tir",
  "Yekatit",
  "Megabit",
  "Miyazia",
  "Ginbot",
  "Sene",
  "Hamle",
  "Nehase",
  "Pagumen",
];

export const mockDepartmentGoals = [
  {
    id: 1,
    name: "Increase Regional Sales",
    plan: { id: 101, name: "Annual Sales Plan 2025" },
    annual_target: 120000,
    monthly_targets: [
      { month: 1, target_value: 10000 },
      { month: 2, target_value: 10000 },
      { month: 4, target_value: 15000 },
      { month: 12, target_value: 15000 },
    ],
    monthly_tasks: [],
    status: "In Progress",
  },
  {
    id: 2,
    name: "Improve Customer Satisfaction",
    plan: { id: 102, name: "Annual Customer Plan 2025" },
    annual_target: 90,
    monthly_targets: [
      { month: 3, target_value: 85 },
      { month: 6, target_value: 90 },
    ],
    monthly_tasks: [],
    status: "Pending",
  },
];


// Get current Ethiopian date as an object with year, month, day
function getCurrentEthiopianDate() {
  const now = new Date();
  const [year, month, day] = toEthiopian(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
  return { year, month, day };
}

// Generate Ethiopian months with year, counting backwards
function generateEthiopianMonthlyTimeframes(numMonths = 3) {
  const current = getCurrentEthiopianDate();
  const year = current.year;
  const month = current.month;
  const timeframes: string[] = [];

  for (let i = 0; i < numMonths; i++) {
    let m = month - i;
    let y = year;
    if (m <= 0) {
      m += 13;
      y -= 1;
    }
    timeframes.push(`${ethiopianMonths[m - 1]} ${y}`);
  }

  return timeframes;
}

// Generate Ethiopian quarters with months included
function generateEthiopianQuarterlyTimeframes(numQuarters = 3) {
  const current = getCurrentEthiopianDate();
  const year = current.year;
  const month = current.month;

  const getQuarter = (m: number) => Math.ceil(m / 3);
  const quarter = getQuarter(month);

  const timeframes: string[] = [];

  for (let i = 0; i < numQuarters; i++) {
    let q = quarter - i;
    let y = year;
    if (q <= 0) {
      q += 5; // 5 quarters in Ethiopian year (13 months)
      y -= 1;
    }

    const startMonth = (q - 1) * 3 + 1;
    const endMonth = Math.min(q * 3, 13);
    const quarterMonths: string[] = [];

    for (let m = startMonth; m <= endMonth; m++) {
      quarterMonths.push(ethiopianMonths[m - 1]);
    }

    timeframes.push(`Q${q} ${y} (${quarterMonths.join(", ")})`);
  }

  return timeframes;
}
// Dynamic Ethiopian timeframes based on report type 
export const reportTypeToTimeframes: Record<string, string[]> = {
  monthly: generateEthiopianMonthlyTimeframes(13),
  quarterly: generateEthiopianQuarterlyTimeframes(4),
  yearly: [String(getCurrentEthiopianDate().year)],
};



/**
 * Invoices have no `title` column — they're a bundle of services under
 * one assessment. This derives an honest heading from what's actually
 * on the invoice instead of a static label that can't represent more
 * than one service.
 */
export function getInvoiceDisplayTitle(invoice: Invoice): string {
  const [first, ...rest] = invoice.items;
  if (!first) return "Invoice";
  if (rest.length === 0) return first.description;
  return `${first.description} + ${rest.length} more`;
}