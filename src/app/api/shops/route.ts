import { NextRequest } from "next/server";
import Shop from "@/models/Shop";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/get-current-user";
import { logWeightActivity } from "@/lib/weight-stock";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const search = new URL(request.url).searchParams.get("search") || "";
    const filter: Record<string, unknown> = { isActive: true };
    if (search) filter.name = { $regex: search, $options: "i" };

    const data = await Shop.find(filter).sort({ name: 1 }).lean();
    return successResponse(data, "Shops retrieved");
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (user?.role !== "admin") {
      return errorResponse("غير مصرح لك بإضافة محلات", 403);
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2) return errorResponse("اسم المحل مطلوب", 400);

    const data = await Shop.create({
      name,
      phone: body.phone || "",
      location: body.location || "",
      notes: body.notes || "",
    });

    await logWeightActivity({
      action: "تم إضافة محل",
      actionType: "shop_created",
      severity: "success",
      details: `تم إضافة المحل "${data.name}"`,
      metadata: { shopId: data._id },
      createdBy: user.userName || "النظام",
    });

    return successResponse(data, "Shop created");
  } catch (error) {
    return handleError(error);
  }
}
