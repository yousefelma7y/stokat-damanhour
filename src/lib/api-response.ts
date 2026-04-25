import { NextResponse } from "next/server";

export function successResponse(
  data: any,
  message: string = "Success",
  extras: any = {},
) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      ...extras,
    },
    { status: 200 },
  );
}

export function errorResponse(message: string = "Error", status: number = 500) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}

export function handleError(error: any) {
  // Enhanced logging for better debugging in production/staging
  console.error("API Error [Detailed]:", {
    message: error.message,
    stack: error.stack,
    name: error.name,
    error: error,
  });
  return errorResponse(error.message || "Internal Server Error", 500);
}
