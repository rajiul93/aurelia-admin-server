import { NextResponse } from "next/server";

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
};

export function success<T>(
  data: T,
  options?: { status?: number; meta?: PaginationMeta },
) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(options?.meta ? { meta: options.meta } : {}),
    },
    { status: options?.status ?? 200 },
  );
}

export function error(
  code: string,
  message: string,
  options?: { status?: number; details?: unknown },
) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(options?.details !== undefined ? { details: options.details } : {}),
      },
    },
    { status: options?.status ?? 500 },
  );
}
