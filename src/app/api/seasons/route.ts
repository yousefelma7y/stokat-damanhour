import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/get-current-user";
import Season from "@/models/Season";
import {
  getCloseBlockers,
  getCurrentSeason,
  getReopenState,
  getSeasonSummary,
} from "@/lib/seasons";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/seasons          → current season with live summary, closed seasons, close/reopen state
 * GET /api/seasons?lite=1   → just the list (for the season switcher)
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (!user) return errorResponse("غير مصرح", 401);

    const current = await getCurrentSeason();
    const lite = new URL(request.url).searchParams.get("lite");

    if (lite) {
      const seasons = await Season.find({})
        .select("name status startDate endDate")
        .sort({ startDate: -1 })
        .lean();
      return successResponse(seasons, "Seasons retrieved", { currentId: current._id });
    }

    if (user.role !== "admin") return errorResponse("غير مصرح", 403);

    const [summary, closedSeasons, blockers, reopen] = await Promise.all([
      getSeasonSummary(current),
      Season.find({ status: "closed" }).sort({ endDate: -1 }).lean(),
      getCloseBlockers(),
      getReopenState(),
    ]);

    return successResponse(
      { current: { season: current, ...summary }, closedSeasons, blockers, reopen },
      "Seasons retrieved",
    );
  } catch (error) {
    return handleError(error);
  }
}
