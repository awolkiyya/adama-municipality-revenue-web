// ethiopianCalendar.ts
import { toGregorian, toEthiopian } from "ethiopian-date"

// Ethiopian month names
export const ETH_MONTHS = [
  "Meskerem","Tikimt","Hidar","Tahsas",
  "Tir","Yekatit","Megabit","Miyazia",
  "Ginbot","Sene","Hamle","Nehase","Pagume"
]

// Week day labels
export const WEEK_DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"]

// Check if Ethiopian year is leap
export function isLeapYear(year: number) {
  return year % 4 === 3
}

// Number of days in Ethiopian month
export function getDaysInMonth(year: number, month: number) {
  if (month === 13) return isLeapYear(year) ? 6 : 5
  return 30
}

// Convert Ethiopian → Gregorian date
// ✅ Set time to noon to prevent timezone shift
export function ethToGregorian(year: number, month: number, day: number) {
  const [y, m, d] = toGregorian(year, month, day)
  return new Date(y, m - 1, d, 12) // noon fixes backward day issue
}

// Convert Gregorian → Ethiopian
export function gregorianToEth(date: Date) {
  const [y, m, d] = toEthiopian(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  )
  return { year: y, month: m, day: d }
}

// First weekday of the Ethiopian month
export function getFirstDay(year: number, month: number) {
  return ethToGregorian(year, month, 1).getDay()
}

// Generate Ethiopian calendar for a month
export function generateEthCalendar(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayIndex = getFirstDay(year, month)
  const cells: (null | { day: number; gregorian: Date })[] = []

  // Fill empty cells before first day
  for (let i = 0; i < firstDayIndex; i++) cells.push(null)

  // Fill actual days with Gregorian date for JS
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, gregorian: ethToGregorian(year, month, d) })
  }

  return cells
}

// Optional: Format Date to Ethiopian string (Meskerem 1, 2015)
export function formatEth(date: Date) {
  const eth = gregorianToEth(date)
  const monthName = ETH_MONTHS[eth.month - 1]
  return `${monthName} ${eth.day}, ${eth.year}`
}