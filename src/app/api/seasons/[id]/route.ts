import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/get-current-user";
import Season from "@/models/Season";
import { getSeasonSummary } from "@/lib/seasons";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (user?.role !== "admin") return errorResponse("غير مصرح", 403);

    const season = await Season.findById(Number(id));
    if (!season) return errorResponse("الموسم غير موجود", 404);

    const summary = await getSeasonSummary(season);
    return successResponse({ season, ...summary }, "Season retrieved");
  } catch (error) {
    return handleError(error);
  }
}

/** Rename a season or edit its notes. Numbers of a closed season are never editable. */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (user?.role !== "admin") return errorResponse("غير مصرح", 403);

    const body = await request.json();
    const update: Record<string, string> = {};
    if (typeof body.name === "string") {
      if (body.name.trim().length < 2) return errorResponse("اسم الموسم مطلوب", 400);
      update.name = body.name.trim();
    }
    if (typeof body.notes === "string") update.notes = body.notes.trim();

    const season = await Season.findByIdAndUpdate(Number(id), { $set: update }, { new: true });
    if (!season) return errorResponse("الموسم غير موجود", 404);
    return successResponse(season, "تم تحديث الموسم");
  } catch (error) {
    return handleError(error);
  }
}
