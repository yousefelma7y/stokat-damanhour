import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Shift from "@/models/Shift";
import Activity from "@/models/Activity";
import { getCurrentUserName, getCurrentUser } from "@/lib/get-current-user";
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
    const data = await Shift.findById(id).populate(
      "user",
      "_id userName phone email role location",
    );
    if (!data) return errorResponse("Shift not found", 404);
    return successResponse(data, "Shift retrieved");
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
    const userContext = await getCurrentUser(request);

    // If closing a shift, validate that it's currently active and owned by the user
    if (body.status === "closed") {
      const shift = await Shift.findById(id);
      if (!shift) return errorResponse("Shift not found", 404);

      if (shift.status === "closed") {
        return errorResponse("هذه الوردية مغلقة بالفعل", 400);
      }

      // Check if user is the one who opened the shift
      if (userContext?.userId !== shift.user) {
        return errorResponse(
          "عذراً، فقط الموظف صاحب الوردية يمكنه إغلاقها",
          403,
        );
      }

      // Set end time if not provided
      if (!body.endTime) {
        body.endTime = new Date();
      }
    }

    const data = await Shift.findByIdAndUpdate(id, body, {
      new: true,
    }).populate("user", "userName phone email role location");

    if (!data) return errorResponse("Shift not found", 404);

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: body.status === "closed" ? "تم إغلاق وردية" : "تم تعديل وردية",
      actionType: body.status === "closed" ? "shift_closed" : "shift_updated",
      createdBy: currentUser,
      severity: body.status === "closed" ? "info" : "warning",
      details:
        body.status === "closed"
          ? `تم إغلاق الوردية رقم ${data.shiftNumber || data._id}`
          : `تم تعديل الوردية رقم ${data.shiftNumber || data._id}`,
      metadata: { shiftId: data._id, changes: body },
    });

    return successResponse(data, "Shift updated");
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

    // Check if shift exists and is not active
    const shift = await Shift.findById(id);
    if (!shift) return errorResponse("Shift not found", 404);

    if (shift.status === "active") {
      return errorResponse("لا يمكن حذف وردية نشطة. يجب إغلاقها أولاً", 400);
    }

    // Soft delete by setting isActive to false
    const data = await Shift.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!data) return errorResponse("Shift not found", 404);

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم حذف وردية",
      actionType: "shift_deleted",
      createdBy: currentUser,
      severity: "error",
      details: `تم حذف الوردية رقم ${shift.shiftNumber || shift._id}`,
      metadata: { shiftId: shift._id },
    });

    return successResponse(data, "Shift deleted");
  } catch (error) {
    return handleError(error);
  }
}
