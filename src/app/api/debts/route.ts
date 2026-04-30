import { NextRequest } from "next/server";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import { connectDB } from "@/lib/mongodb";
import { roundMoney } from "@/lib/order-payments";
import { handleError, successResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Number(searchParams.get("limit") || 20));
    const search = searchParams.get("search") || "";

    const filter: any = {
      isActive: true,
      $or: [
        { debtBalance: { $gt: 0.01 } },
        { debtBalance: { $exists: false } } 
      ]
    };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Run all three queries in parallel
    const [total, customers, stats] = await Promise.all([
      Customer.countDocuments(filter),
      Customer.find(filter)
        .sort({ debtBalance: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.aggregate([
        { $match: { isActive: true, debtBalance: { $gt: 0.01 } } },
        {
          $group: {
            _id: null,
            customersWithDebt: { $sum: 1 },
            totalDebt: { $sum: "$debtBalance" },
            lifetimeDebt: { $sum: "$totalDebt" },
            totalSettled: { $sum: "$totalDebtPaid" },
          },
        },
      ]),
    ]);

    // Batch-fetch all debt orders for these customers in ONE query instead of N
    const customerIds = customers.map((c) => c._id);
    const allDebtOrders = await Order.find({
      customer: { $in: customerIds },
      status: "completed",
      remainingAmount: { $gt: 0.01 },
      isActive: true,
    })
      .select("_id orderNumber total paidAmount remainingAmount createdAt customer")
      .sort({ createdAt: 1 })
      .lean();

    // Group orders by customer ID
    const ordersByCustomer: Record<number, any[]> = {};
    for (const order of allDebtOrders) {
      const cid = order.customer as number;
      if (!ordersByCustomer[cid]) ordersByCustomer[cid] = [];
      ordersByCustomer[cid].push(order);
    }

    const data = customers.map((customer) => {
      const orders = ordersByCustomer[customer._id] || [];
      return {
        ...customer,
        debtBalance: roundMoney(Number(customer.debtBalance || 0)),
        debtOrders: orders,
        debtOrdersCount: orders.length,
        oldestDebtAt: orders[0]?.createdAt || null,
        lastDebtAt: orders[orders.length - 1]?.createdAt || null,
      };
    });

    return successResponse(data, "Debts retrieved", {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      stats: stats[0] || {
        customersWithDebt: 0,
        totalDebt: 0,
        lifetimeDebt: 0,
        totalSettled: 0,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
