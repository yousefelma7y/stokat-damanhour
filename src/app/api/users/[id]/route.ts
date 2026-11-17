import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";
import {
  validateUserPayload,
  validationErrorResponse,
  mongooseErrorToFieldErrors,
} from "@/lib/user-validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const data = await User.findById(id);
    if (!data) return errorResponse("User not found", 404);
    return successResponse(data, "User retrieved");
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

    // Don't overwrite the password with an empty value
    if (!body.password) delete body.password;

    const errors = await validateUserPayload(body, "update", id);
    if (Object.keys(errors).length) return validationErrorResponse(errors);

    if ("salary" in body) body.salary = Number(body.salary);

    const data = await User.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });
    if (!data) return errorResponse("User not found", 404);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم تحديث بيانات مستخدم",
      actionType: "user_updated",
      createdBy: currentUser,
      severity: "info",
      details: `تم تحديث بيانات المستخدم "${data.userName}"`,
      metadata: { userId: data._id, updates: Object.keys(body) },
    });

    return successResponse(data, "User updated");
  } catch (error) {
    const fieldErrors = mongooseErrorToFieldErrors(error);
    if (fieldErrors) return validationErrorResponse(fieldErrors);
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
    const data = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!data) return errorResponse("User not found", 404);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم حذف مستخدم",
      actionType: "user_deleted",
      createdBy: currentUser,
      severity: "warning",
      details: `تم حذف المستخدم "${data.userName}"`,
      metadata: { userId: data._id },
    });

    return successResponse(data, "User deleted");
  } catch (error) {
    return handleError(error);
  }
}
