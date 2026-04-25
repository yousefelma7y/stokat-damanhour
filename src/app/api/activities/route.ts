import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Activity from "@/models/Activity";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const createdBy = searchParams.get("createdBy") || "";
    const severity = searchParams.get("severity") || "";
    const actionType = searchParams.get("actionType") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const filter: any = { isActive: true };

    // Search filter - search across action, details, and createdBy
    if (search) {
      filter.$or = [
        { action: { $regex: search, $options: "i" } },
        { details: { $regex: search, $options: "i" } },
        { createdBy: { $regex: search, $options: "i" } },
      ];
    }

    // User/createdBy filter
    if (createdBy) {
      filter.createdBy = createdBy;
    }

    // Severity filter
    if (severity) {
      filter.severity = severity;
    }

    // Action type filter
    if (actionType) {
      filter.actionType = actionType;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add 1 day to include the end date
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        filter.createdAt.$lt = end;
      }
    }

    const skip = (page - 1) * limit;
    const total = await Activity.countDocuments(filter);
    const data = await Activity.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return successResponse(data, "Activities retrieved", {
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
    const data = await Activity.create(body);
    return successResponse(data, "Activity created");
  } catch (error) {
    return handleError(error);
  }
}
