import { NextRequest } from "next/server";
import Activity from "@/models/Activity";
import WeightProduct from "@/models/WeightProduct";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  handleError,
  successResponse,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const search = searchParams.get("search") || "";

    const filter: Record<string, unknown> = { isActive: true };

    if (search) {
      if (!Number.isNaN(Number(search))) {
        filter._id = Number(search);
      } else {
        filter.name = { $regex: search, $options: "i" };
      }
    }

    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      WeightProduct.countDocuments(filter),
      WeightProduct.find(filter)
        .select("_id name pricePerKg")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return successResponse(data, "Weight products retrieved", {
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
    const currentUser = await getCurrentUserName(request);
    const data = await WeightProduct.create(body);

    await Activity.create({
      action: "تم إضافة صنف وزن",
      actionType: "weight_product_created",
      createdBy: currentUser,
      severity: "success",
      details: `تم إضافة صنف الوزن "${data.name}"`,
      metadata: { weightProductId: data._id },
    });

    return successResponse(data, "Weight product created");
  } catch (error) {
    return handleError(error);
  }
}
