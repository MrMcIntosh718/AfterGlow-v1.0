import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "CONFIGURATION_ERROR"
  | "UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

export function apiError(
  message: string,
  status: number,
  code: ApiErrorCode,
  headers?: HeadersInit
) {
  return NextResponse.json(
    { error: message, code },
    { status, headers }
  );
}
