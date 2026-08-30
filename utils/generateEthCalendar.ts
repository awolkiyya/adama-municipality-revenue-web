import { getDaysInMonth, getFirstDay, ethToGregorian } from "./ethiopianCalendar";

export interface EthDay {
  day: number;
  month: number;
  year: number;
  gregorian: Date;
}

/**
 * Generate an Ethiopian month calendar with nulls for leading empty cells.
 */
export function generateEthCalendar(year: number, month: number): (null | EthDay)[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDay(year, month);
  const cells: (null | EthDay)[] = [];

  // Add empty cells for alignment
  for (let i = 0; i < firstDay; i++) cells.push(null);

  // Add actual days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      month,
      year,
      gregorian: ethToGregorian(year, month, d),
    });
  }

  return cells;
}