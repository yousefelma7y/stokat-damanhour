import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/get-current-user";
import { reopenLastSeason } from "@/lib/seasons";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** Undo the last close. Only works while the new season has no activity. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (user?.role !== "admin") {
      return errorResponse("إعادة فتح الموسم متاحة لمدير النظام فقط", 403);
    }

    const season = await reopenLastSeason(Number(id), user.userName || "النظام");
    return successResponse(season, "تم إعادة فتح الموسم");
  } catch (error: any) {
    if (error?.name === "SeasonError") {
      return errorResponse(error.message, error.status);
    }
    return handleError(error);
  }
}
