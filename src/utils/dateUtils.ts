/**
 * Utility functions for handling dates in a timezone-neutral way
 * for date-only fields (like invoice dates, medical record dates, etc.)
 */

/**
 * Creates a Date object from a date string (YYYY-MM-DD) that represents
 * the same calendar date regardless of timezone
 * @param dateString Date string in YYYY-MM-DD format
 * @returns Date object set to noon local time to avoid timezone shifting
 */
export function createLocalDate(dateString: string): Date {
  if (!dateString) return new Date();

  const [year, month, day] = dateString.split("-").map(Number);
  // Create date at noon local time to avoid timezone shifting issues
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * Formats a Date object to YYYY-MM-DD string for use in date input fields
 * Uses local timezone to avoid date shifting
 * @param date Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForInput(
  date: Date | string | null | undefined
): string {
  if (!date) return new Date().toISOString().split("T")[0];

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Use local timezone methods to avoid UTC conversion
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object for display using local timezone
 * @param date Date object to format
 * @param options Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string
 */
export function formatDateForDisplay(
  date: Date | string | null | undefined,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return "Not specified";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    ...options,
  };

  return dateObj.toLocaleDateString(undefined, defaultOptions);
}

/**
 * Gets today's date formatted for input fields
 * @returns Today's date in YYYY-MM-DD format
 */
export function getTodayForInput(): string {
  return formatDateForInput(new Date());
}

/**
 * Creates a date that's a certain number of days from now
 * @param daysFromNow Number of days to add to current date
 * @returns Date object
 */
export function getDateDaysFromNow(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}
