import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { handleError, successResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * Lightweight list of active users for dropdowns (sales user selection,
 * filters). Only exposes id, name and role – no salary/phone/etc.
 */
export async function GET(_request: NextRequest) {
  try {
    await connectDB();
    const users = await User.find({ isActive: true })
      .select("_id userName role")
      .sort({ userName: 1 })
      .lean();

    return successResponse(users, "Users retrieved");
  } catch (error) {
    return handleError(error);
  }
}
