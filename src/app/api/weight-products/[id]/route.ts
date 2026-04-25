import { NextRequest } from "next/server";
import Activity from "@/models/Activity";
import WeightProduct from "@/models/WeightProduct";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await connectDB();
    const data = await WeightProduct.findById(id);
    if (!data) return errorResponse("Weight product not found", 404);
    return successResponse(data, "Weight product retrieved");
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await connectDB();
    const body = await request.json();
    const currentUser = await getCurrentUserName(request);
    const data = await WeightProduct.findByIdAndUpdate(id, body, { new: true });

    if (!data) return errorResponse("Weight product not found", 404);

    await Activity.create({
      action: "تم تعديل صنف وزن",
      actionType: "weight_product_updated",
      createdBy: currentUser,
      severity: "warning",
      details: `تم تعديل صنف الوزن "${data.name}"`,
      metadata: { weightProductId: data._id, changes: body },
    });

    return successResponse(data, "Weight product updated");
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
    const currentUser = await getCurrentUserName(request);
    const data = await WeightProduct.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!data) return errorResponse("Weight product not found", 404);

    await Activity.create({
      action: "تم حذف صنف وزن",
      actionType: "weight_product_deleted",
      createdBy: currentUser,
      severity: "error",
      details: `تم حذف صنف الوزن "${data.name}"`,
      metadata: { weightProductId: data._id },
    });

    return successResponse(data, "Weight product deleted");
  } catch (error) {
    return handleError(error);
  }
}
