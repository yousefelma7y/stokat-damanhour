import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
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
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";
    const stockStatus = searchParams.get("stockStatus") || "all";

    const filter: any = { isActive: true };
    if (search)
      if (!isNaN(Number(search))) filter._id = Number(search);
      else
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { model: { $regex: search, $options: "i" } },
        ];

    if (stockStatus === "inStock") {
      filter.stock = { $gt: 0 };
    } else if (stockStatus === "outOfStock") {
      filter.stock = { $lte: 0 };
    }

    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .select("_id name model size price stock barcode category")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return successResponse(data, "Products retrieved", {
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
    const data = await Product.create(body);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم إضافة منتج جديد",
      actionType: "product_created",
      createdBy: currentUser,
      severity: "success",
      details: `تم إضافة المنتج "${data.name}" - الموديل: ${data.model || "غير محدد"}`,
      metadata: { productId: data._id, barcode: data.barcode },
    });

    return successResponse(data, "Product created");
  } catch (error) {
    return handleError(error);
  }
}
