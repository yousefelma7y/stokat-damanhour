import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";
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
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    const filter: any = { isActive: true };

    if (search) {
      const searchConditions: any[] = [
        { userName: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];

      // Only search by _id if the search string is a valid number
      if (!isNaN(Number(search))) {
        searchConditions.push({ _id: Number(search) });
      }

      filter.$or = searchConditions;
    }
    if (role) {
      filter.role = role;
    }
    const skip = (page - 1) * limit;
    const total = await User.countDocuments(filter);
    const data = await User.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return successResponse(data, "Users retrieved", {
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
    const data = await User.create(body);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم إضافة مستخدم جديد",
      actionType: "user_created",
      createdBy: currentUser,
      severity: "success",
      details: `تم إضافة المستخدم "${data.userName}" بصلاحية ${data.role}`,
      metadata: { userId: data._id, role: data.role },
    });

    return successResponse(data, "User created");
  } catch (error) {
    return handleError(error);
  }
}
