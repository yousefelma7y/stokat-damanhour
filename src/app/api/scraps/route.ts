import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Scrap from "@/models/Scrap";
import Product from "@/models/Product";
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
      else
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
        ];
    }

    const skip = (page - 1) * limit;
    const total = await Scrap.countDocuments(filter);
    const data = await Scrap.find(filter)
      .populate("productId")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return successResponse(data, "Scraps retrieved", {
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
    const data = await Scrap.create(body);

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم إضافة منتج تالف",
      actionType: "scrap_created",
      createdBy: currentUser,
      severity: "warning",
      details: `تم تسجيل منتج تالف - السبب: ${data.reason || "غير محدد"}`,
      metadata: { scrapId: data._id, productId: data.productId },
    });

    return successResponse(data, "Scrap created");
  } catch (error) {
    return handleError(error);
  }
}
