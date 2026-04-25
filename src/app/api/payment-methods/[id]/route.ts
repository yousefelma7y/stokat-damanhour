import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PaymentMethod, Activity } from "@/models";
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
  try {
    await connectDB();
    const resolvedParams = await params;
    const data = await PaymentMethod.findById(resolvedParams.id);
    if (!data) return errorResponse("Payment method not found", 404);
    return successResponse(data, "Payment method retrieved");
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const body = await request.json();
    const data = await PaymentMethod.findByIdAndUpdate(
      resolvedParams.id,
      body,
      {
        new: true,
      },
    );
    if (!data) return errorResponse("Payment method not found", 404);

    const currentUser = await getCurrentUserName(request);

    await Activity.create({
      action: "تم تحديث وسيلة دفع",
      actionType: "payment_method_updated",
      createdBy: currentUser,
      severity: "info",
      details: `تم تحديث وسيلة الدفع "${data.name}"`,
      metadata: { paymentMethodId: data._id },
    });

    return successResponse(data, "Payment method updated");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const data = await PaymentMethod.findByIdAndUpdate(
      resolvedParams.id,
      { isActive: false },
      { new: true },
    );
    if (!data) return errorResponse("Payment method not found", 404);

    const currentUser = await getCurrentUserName(request);

    await Activity.create({
      action: "تم حذف وسيلة دفع",
      actionType: "payment_method_deleted",
      createdBy: currentUser,
      severity: "warning",
      details: `تم حذف وسيلة الدفع "${data.name}"`,
      metadata: { paymentMethodId: data._id },
    });

    return successResponse(data, "Payment method deleted");
  } catch (error) {
    return handleError(error);
  }
}
