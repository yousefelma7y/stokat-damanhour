import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import Transaction from "@/models/Transaction";
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
  try {
    await connectDB();
    const id = parseInt((await params).id);

    if (isNaN(id)) {
      return errorResponse("معرف العميل غير صحيح", 400);
    }

    const customer = await Customer.findById(id);
    if (!customer) {
      return errorResponse("العميل غير موجود", 404);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");

    const filter = {
      customer: id,
      isActive: true,
    };

    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(filter);

    // Fetch customer orders
    const ordersPromise = Order.find(filter)
      .populate("items.product", "name model size price")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Fetch customer-related transactions
    const transactionsPromise = Transaction.find({
      relatedModel: "Order",
      description: { $regex: String(id), $options: "i" },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    const [orders, transactions] = await Promise.all([
      ordersPromise,
      transactionsPromise,
    ]);

    // Calculate stats
    const stats = {
      totalOrders: total,
      completedOrders: await Order.countDocuments({
        ...filter,
        status: "completed",
      }),
      totalSpent: customer.totalPayments || 0,
    };

    return successResponse(
      {
        customer,
        orders,
        transactions,
        stats,
      },
      "Customer details retrieved",
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    );
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
    const data = await Customer.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!data) return errorResponse("Customer not found", 404);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم تعديل بيانات عميل",
      actionType: "customer_updated",
      createdBy: currentUser,
      severity: "warning",
      details: `تم تعديل بيانات العميل "${data.name}"`,
      metadata: { customerId: data._id, changes: body },
    });

    return successResponse(data, "Customer updated");
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
    const data = await Customer.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!data) return errorResponse("Customer not found", 404);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم حذف عميل",
      actionType: "customer_deleted",
      createdBy: currentUser,
      severity: "error",
      details: `تم حذف العميل "${data.name}"`,
      metadata: { customerId: data._id },
    });

    return successResponse(data, "Customer deleted");
  } catch (error) {
    return handleError(error);
  }
}
