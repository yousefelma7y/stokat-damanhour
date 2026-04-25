import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
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
    const data = await Invoice.findById(id);
    if (!data) return errorResponse("Invoice not found", 404);
    return successResponse(data, "Invoice retrieved");
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
    const data = await Invoice.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!data) return errorResponse("Invoice not found", 404);
    return successResponse(data, "Invoice updated");
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
    const data = await Invoice.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!data) return errorResponse("Invoice not found", 404);
    return successResponse(data, "Invoice deleted");
  } catch (error) {
    return handleError(error);
  }
}
