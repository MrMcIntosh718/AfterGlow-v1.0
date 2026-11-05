/**
 * Typed error for failures in an upstream provider (Ticketmaster, Mapbox, ...).
 *
 * Search code throws this instead of returning an empty list, so a provider
 * outage or a missing API key is never mistaken for "no events found".
 */
export type ProviderErrorCode = "not-configured" | "upstream" | "timeout";

export class ProviderError extends Error {
  readonly provider: string;
  readonly code: ProviderErrorCode;
  readonly upstreamStatus?: number;

  constructor(
    provider: string,
    message: string,
    code: ProviderErrorCode = "upstream",
    upstreamStatus?: number
  ) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.code = code;
    this.upstreamStatus = upstreamStatus;
  }
}

export function isProviderError(error: unknown): error is ProviderError {
  return error instanceof ProviderError;
}

/** Message that is safe to show to end users (never includes keys or upstream bodies). */
export function publicMessage(error: unknown): string {
  if (isProviderError(error) && error.code === "not-configured") {
    return "Event search is not configured yet.";
  }
  return "Event search is temporarily unavailable. Please try again in a moment.";
}
