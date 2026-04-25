import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Service from "@/models/Service";
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
    const data = await Service.findById(id);
    if (!data) return errorResponse("Service not found", 404);
    return successResponse(data, "Service retrieved");
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
    const data = await Service.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!data) return errorResponse("Service not found", 404);

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم تعديل خدمة",
      actionType: "service_updated",
      createdBy: currentUser,
      severity: "warning",
      details: `تم تعديل بيانات الخدمة "${data.name}"`,
      metadata: { serviceId: data._id, changes: body },
    });

    return successResponse(data, "Service updated");
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
    const data = await Service.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!data) return errorResponse("Service not found", 404);

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم حذف خدمة",
      actionType: "service_deleted",
      createdBy: currentUser,
      severity: "error",
      details: `تم حذف الخدمة "${data.name}"`,
      metadata: { serviceId: data._id },
    });

    return successResponse(data, "Service deleted");
  } catch (error) {
    return handleError(error);
  }
}
