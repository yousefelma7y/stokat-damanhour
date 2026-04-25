import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Shift from "@/models/Shift";
import User from "@/models/User";
import Activity from "@/models/Activity";
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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const user = searchParams.get("user") || "";

    const filter: any = {};

    // User filter
    if (user) {
      filter.user = Number(user);
    }

    // Search filter - search by shift number or user.userName
    if (search) {
      // find users matching the search term and filter by their ids
      const matchingUsers = await User.find({
        userName: { $regex: search, $options: "i" },
      }).select("_id");
      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { shiftNumber: { $regex: search, $options: "i" } },
        { user: { $in: userIds } },
      ];
    }

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.startTime = {};

      if (startDate) {
        filter.startTime.$gte = new Date(startDate);
      }

      if (endDate) {
        // Set to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.startTime.$lte = endDateTime;
      }
    }

    const skip = (page - 1) * limit;
    const total = await Shift.countDocuments(filter);

    const data = await Shift.find(filter)
      .populate("user", "_id userName phone email role location")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return successResponse(data, "Shifts retrieved", {
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
    const userContext = await getCurrentUser(request);

    // 1. Check if user is admin
    if (userContext?.role !== "admin") {
      return errorResponse("عذراً، فقط المدير يمكنه فتح الوردية", 403);
    }

    // 2. Check if there's already an active shift for this user
    const existingActiveShift = await Shift.findOne({
      user: body.user,
      status: "active",
    });

    if (existingActiveShift) {
      return errorResponse("يوجد وردية نشطة بالفعل لهذا الموظف", 400);
    }

    // Check if there's any active shift in the system (if you want only one active shift at a time)
    const anyActiveShift = await Shift.findOne({ status: "active" });

    if (anyActiveShift) {
      return errorResponse(
        "يوجد وردية نشطة بالفعل. يجب إغلاق الوردية الحالية أولاً",
        400,
      );
    }

    const data = await Shift.create(body);
    const populatedData = await Shift.findById(data._id).populate(
      "user",
      "userName phone email role location",
    );

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم بدء وردية جديدة",
      actionType: "shift_created",
      createdBy: currentUser,
      severity: "success",
      details: `تم بدء وردية جديدة رقم ${data.shiftNumber || data._id}`,
      metadata: { shiftId: data._id, userId: data.user },
    });

    return successResponse(populatedData, "Shift created");
  } catch (error) {
    return handleError(error);
  }
}
