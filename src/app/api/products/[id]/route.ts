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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const data = await Product.findById(id);
    if (!data) return errorResponse("Product not found", 404);
    return successResponse(data, "Product retrieved");
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
    const data = await Product.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!data) return errorResponse("Product not found", 404);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم تعديل منتج",
      actionType: "product_updated",
      createdBy: currentUser,
      severity: "warning",
      details: `تم تعديل المنتج "${data.name}"`,
      metadata: { productId: data._id, changes: body },
    });

    return successResponse(data, "Product updated");
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
    const data = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!data) return errorResponse("Product not found", 404);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم حذف منتج",
      actionType: "product_deleted",
      createdBy: currentUser,
      severity: "error",
      details: `تم حذف المنتج "${data.name}"`,
      metadata: { productId: data._id },
    });

    return successResponse(data, "Product deleted");
  } catch (error) {
    return handleError(error);
  }
}
