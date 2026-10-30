/** Shared input validation helpers used at API boundaries. */

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date in YYYY-MM-DD form (rejects 2026-02-31 and trailing text). */
export function isValidDate(value: string | null | undefined): value is string {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Strip control characters, trim, and cap length. React escapes output, so no HTML stripping. */
export function sanitizeString(input: string, maxLength = 500): string {
  if (typeof input !== "string") return "";
  return input.replace(/[\x00-\x1f\x7f]/g, "").trim().slice(0, maxLength);
}

export function sanitizeSearchQuery(query: string): string {
  return sanitizeString(query, 200);
}

export function isValidCoordinates(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180;
}

export function isValidStopId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= 120;
}
