import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ShiftSummary from "@/models/ShiftSummary";
import User from "@/models/User";
import { getCurrentUserName, getCurrentUser } from "@/lib/get-current-user";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userContext = await getCurrentUser(request);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const userParam = searchParams.get("user") || "";

    const filter: any = {};
    if (search && !isNaN(Number(search))) filter._id = Number(search);
    // if (search) filter.summaryNumber = { $regex: search, $options: "i" };
    // RBAC: If not admin, force filter to current user only
    if (userContext?.role !== "admin") {
      filter.user = userContext?.userId;
    } else if (userParam) {
      // If admin and user param provided, filter by that user
      filter.user = Number(userParam);
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateTime;
      }
    }

    const skip = (page - 1) * limit;
    const total = await ShiftSummary.countDocuments(filter);

    const data = await ShiftSummary.find(filter)
      .populate("user", "userName phone location role")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return successResponse(data, "Shift Summaries retrieved", {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    body.summaryNumber = `SUM-${timestamp}-${random}`;

    // Get the User Name for redundancy
    const u = await User.findById(body.user);
    if (u) {
      body.userName = u.userName;
    }

    const data = await ShiftSummary.create(body);
    const populatedData = await ShiftSummary.findById(data._id).populate(
      "user",
      "userName phone role location",
    );

    return successResponse(populatedData, "Shift Summary created");
  } catch (error) {
    return handleError(error);
  }
}
