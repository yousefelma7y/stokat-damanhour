import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/get-current-user";
import { closeCurrentSeason, getCurrentSeason } from "@/lib/seasons";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Close the open season and start a new one.
 * body: { confirmName, name?, nextName?, notes? }
 * confirmName must match the open season's name (guards against accidental closes).
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (user?.role !== "admin") {
      return errorResponse("إقفال الموسم متاح لمدير النظام فقط", 403);
    }

    const body = await request.json();
    const current = await getCurrentSeason();
    if (String(body.confirmName || "").trim() !== current.name.trim()) {
      return errorResponse("اكتب اسم الموسم الحالي كما هو لتأكيد الإقفال", 400);
    }

    const result = await closeCurrentSeason({
      name: body.name,
      nextName: body.nextName,
      notes: body.notes,
      closedBy: user.userName || "النظام",
    });

    return successResponse(result, "تم إقفال الموسم وبدء موسم جديد");
  } catch (error: any) {
    if (error?.name === "SeasonError") {
      return errorResponse(error.message, error.status);
    }
    return handleError(error);
  }
}
