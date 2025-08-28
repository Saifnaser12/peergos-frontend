/**
 * Date utilities for tax periods and deadlines
 */

export function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

export function getQuarterStart(year: number, quarter: number): Date {
  return new Date(year, (quarter - 1) * 3, 1);
}

export function getQuarterEnd(year: number, quarter: number): Date {
  return new Date(year, quarter * 3, 0);
}

export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function getYearStart(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export function getYearEnd(date: Date): Date {
  return new Date(date.getFullYear(), 11, 31);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function getDaysBetween(startDate: Date, endDate: Date): number {
  const timeDifference = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
}

export function isDateInPeriod(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate;
}

export function getVatDeadline(month: number, year: number): Date {
  // VAT returns are due by the 28th of the following month
  const deadlineMonth = month === 11 ? 0 : month + 1;
  const deadlineYear = month === 11 ? year + 1 : year;
  return new Date(deadlineYear, deadlineMonth, 28);
}

export function getCitDeadline(year: number): Date {
  // CIT returns are due by April 30th of the following year
  return new Date(year + 1, 3, 30); // April is month 3 (0-indexed)
}

export function getUpcomingDeadlines(date: Date = new Date()) {
  const deadlines = [];
  
  // VAT deadline for current month
  const vatDeadline = getVatDeadline(date.getMonth(), date.getFullYear());
  const daysToVat = getDaysBetween(date, vatDeadline);
  
  if (daysToVat > 0 && daysToVat <= 45) {
    deadlines.push({
      title: 'VAT Return Filing',
      date: vatDeadline.toISOString().split('T')[0],
      daysLeft: daysToVat,
      priority: daysToVat <= 14 ? 'HIGH' : 'MEDIUM',
      type: 'VAT',
    });
  }
  
  // CIT deadline for current year
  const citDeadline = getCitDeadline(date.getFullYear());
  const daysToCit = getDaysBetween(date, citDeadline);
  
  if (daysToCit > 0 && daysToCit <= 90) {
    deadlines.push({
      title: 'CIT Return (Annual)',
      date: citDeadline.toISOString().split('T')[0],
      daysLeft: daysToCit,
      priority: daysToCit <= 30 ? 'HIGH' : 'MEDIUM',
      type: 'CIT',
    });
  }
  
  return deadlines.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function formatPeriod(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString('en-AE', { month: 'short', year: 'numeric' });
  const end = endDate.toLocaleDateString('en-AE', { month: 'short', year: 'numeric' });
  
  if (start === end) {
    return start;
  }
  
  return `${start} - ${end}`;
}

export function getCurrentTaxPeriod(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const start = new Date(currentYear, currentMonth, 1);
  const end = new Date(currentYear, currentMonth + 1, 0);
  
  return {
    start,
    end,
    label: start.toLocaleDateString('en-AE', { month: 'long', year: 'numeric' }),
  };
}
