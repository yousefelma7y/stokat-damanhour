import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Activity from "@/models/Activity";
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
    const data = await Activity.findById(id);
    if (!data) return errorResponse("Activity not found", 404);
    return successResponse(data, "Activity retrieved");
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
    const data = await Activity.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!data) return errorResponse("Activity not found", 404);
    return successResponse(data, "Activity updated");
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
    const data = await Activity.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!data) return errorResponse("Activity not found", 404);
    return successResponse(data, "Activity deleted");
  } catch (error) {
    return handleError(error);
  }
}
