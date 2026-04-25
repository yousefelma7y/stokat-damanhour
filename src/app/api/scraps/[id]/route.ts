import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Scrap from "@/models/Scrap";
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
    const data = await Scrap.findById(id);
    if (!data) return errorResponse("Scrap not found", 404);
    return successResponse(data, "Scrap retrieved");
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
    const data = await Scrap.findByIdAndUpdate(id, body, { new: true });
    if (!data) return errorResponse("Scrap not found", 404);

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم تعديل بيانات الخردة",
      actionType: "scrap_updated",
      createdBy: currentUser,
      severity: "warning",
      details: `تم تعديل بيانات منتج تالف: ${data.name || data._id}`,
      metadata: { scrapId: data._id, changes: body },
    });

    return successResponse(data, "Scrap updated");
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
    const data = await Scrap.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!data) return errorResponse("Scrap not found", 404);

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم حذف بيانات الخردة",
      actionType: "scrap_deleted",
      createdBy: currentUser,
      severity: "error",
      details: `تم حذف بيانات منتج تالف: ${data.name || data._id}`,
      metadata: { scrapId: data._id },
    });

    return successResponse(data, "Scrap deleted");
  } catch (error) {
    return handleError(error);
  }
}
