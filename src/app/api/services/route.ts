import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Service from "@/models/Service";
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

    const filter: any = { isActive: true };
    if (search) {
      if (!isNaN(Number(search))) filter._id = Number(search);
      else filter.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    const skip = (page - 1) * limit;
    const total = await Service.countDocuments(filter);
    const data = await Service.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return successResponse(data, "Services retrieved", {
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
    const data = await Service.create(body);

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم إضافة خدمة جديدة",
      actionType: "service_created",
      createdBy: currentUser,
      severity: "success",
      details: `تم إضافة الخدمة "${data.name}" بنجاح`,
      metadata: { serviceId: data._id },
    });

    return successResponse(data, "Service created");
  } catch (error) {
    return handleError(error);
  }
}
