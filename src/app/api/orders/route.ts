import { NextRequest } from "next/server";
import Order from "@/models/Order";
import { connectDB } from "@/lib/mongodb";
import { paginate } from "@/lib/query-helper";
import { OrderService } from "@/services/order.service";
import { createOrderSchema } from "@/validations/order.schema";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);

    const filter: any = { isActive: true };
    const search = searchParams.get("search");

    if (search && !Number.isNaN(Number(search))) {
      filter._id = Number(search);
    }

    if (searchParams.get("status")) filter.status = searchParams.get("status");
    if (searchParams.get("orderType")) {
      filter.order_type = searchParams.get("orderType");
    }
    if (searchParams.get("createdBy")) {
      filter.createdBy = searchParams.get("createdBy");
    }
    if (searchParams.get("paymentMethod")) {
      const pm = searchParams.get("paymentMethod");
      if (!Number.isNaN(Number(pm))) {
        filter.$or = [
          { paymentMethodId: Number(pm) }
        ];
      } else {
        filter.paymentMethod = pm;
      }
    }

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const result = await paginate(Order, filter, {
      page: Number(searchParams.get("page")),
      limit: Number(searchParams.get("limit")),
      populate: [
        { path: "customer", select: "name phone location" },
        { path: "items.product", select: "name model size" },
        { path: "weightItems.weightProduct", select: "name pricePerKg" },
      ],
    });

    const statsFilter = { ...filter };
    delete statsFilter.status;

    const stats = await Order.aggregate([
      { $match: statsFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$total", 0] },
          },
        },
      },
    ]);

    return successResponse(result.data, "Orders retrieved", {
      page: result.page,
      limit: result.limit,
      total: result.total,
      pages: result.pages,
      stats: stats[0] || {
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const validatedData = createOrderSchema.safeParse(body);

    if (!validatedData.success) {
      const messages = validatedData.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      return errorResponse(messages || "Invalid input", 400);
    }

    const currentUser = await getCurrentUserName(request);
    const order = await OrderService.createOrder(validatedData.data, currentUser);
    return successResponse(order, "Order created successfully");
  } catch (error: any) {
    return errorResponse(error.message, 400);
  }
}
