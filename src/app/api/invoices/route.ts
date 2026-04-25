import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Invoice from "@/models/Invoice";
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const filter: any = { isActive: true };
    if (search) {
      filter.$or = [{ name: { $regex: search, $options: "i" } }];
    }

    const skip = (page - 1) * limit;
    const total = await Invoice.countDocuments(filter);
    const data = await Invoice.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return successResponse(data, "Invoices retrieved", {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const data = await Invoice.create(body);

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم إنشاء فاتورة جديدة",
      actionType: "invoice_created",
      createdBy: currentUser,
      severity: "success",
      details: `تم إنشاء فاتورة جديدة`,
      metadata: { invoiceId: data._id },
    });

    return successResponse(data, "Invoice created");
  } catch (error) {
    return handleError(error);
  }
}
