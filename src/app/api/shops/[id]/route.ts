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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (user?.role !== "admin") {
      return errorResponse("غير مصرح لك بتعديل المحلات", 403);
    }

    const body = await request.json();
    const update: Record<string, string> = {};
    for (const field of ["name", "phone", "location", "notes"]) {
      if (typeof body[field] === "string") update[field] = body[field].trim();
    }
    if (update.name !== undefined && update.name.length < 2) {
      return errorResponse("اسم المحل مطلوب", 400);
    }

    const data = await Shop.findByIdAndUpdate(id, update, { new: true });
    if (!data) return errorResponse("المحل غير موجود", 404);

    await logWeightActivity({
      action: "تم تعديل محل",
      actionType: "shop_updated",
      severity: "warning",
      details: `تم تعديل بيانات المحل "${data.name}"`,
      metadata: { shopId: data._id, changes: update },
      createdBy: user.userName || "النظام",
    });

    return successResponse(data, "Shop updated");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (user?.role !== "admin") {
      return errorResponse("غير مصرح لك بحذف المحلات", 403);
    }

    // Soft delete: past transfers keep pointing at the shop.
    const data = await Shop.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!data) return errorResponse("المحل غير موجود", 404);

    await logWeightActivity({
      action: "تم حذف محل",
      actionType: "shop_deleted",
      severity: "error",
      details: `تم حذف المحل "${data.name}"`,
      metadata: { shopId: data._id },
      createdBy: user.userName || "النظام",
    });

    return successResponse(data, "Shop deleted");
  } catch (error) {
    return handleError(error);
  }
}
