import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Account from "@/models/Account";
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    await connectDB();
    const data = await Account.findById(id);
    if (!data) return errorResponse("Account not found", 404);
    return successResponse(data, "Account retrieved");
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    await connectDB();
    const body = await request.json();
    const data = await Account.findByIdAndUpdate(id, body, { new: true });
    if (!data) return errorResponse("Account not found", 404);

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم تعديل حساب",
      actionType: "account_updated",
      createdBy: currentUser,
      severity: "warning",
      details: `تم تعديل الحساب "${data.entityName}"`,
      metadata: { accountId: data._id, changes: body },
    });

    return successResponse(data, "Account updated");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    await connectDB();
    const data = await Account.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!data) return errorResponse("Account not found", 404);

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم حذف حساب",
      actionType: "account_deleted",
      createdBy: currentUser,
      severity: "error",
      details: `تم حذف الحساب "${data.entityName}"`,
      metadata: { accountId: data._id },
    });

    return successResponse(data, "Account deleted");
  } catch (error) {
    return handleError(error);
  }
}
