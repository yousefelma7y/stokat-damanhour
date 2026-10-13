// FILE LOCATION: app/api/customers/lookup/route.ts

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { getTopCustomerRank } from "@/lib/top-customers";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

/**
 * GET /api/customers/lookup?phone=01234567890
 *
 * Check if customer exists by phone number
 * Returns customer data if found, or null if not found
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return errorResponse("رقم الهاتف مطلوب", 400);
    }

    // Search for customer by phone
    const customer = await Customer.findOne({
      phone: phone.trim(),
      isActive: true,
    });

    if (customer) {
      // topRank (1-10) tells the cashier this is one of the best customers.
      const { completedOrders = [], ...rest } = customer.toObject();
      const topRank = await getTopCustomerRank(customer._id);
      return successResponse(
        { ...rest, ordersCount: completedOrders.length, topRank },
        "تم العثور على العميل",
      );
    } else {
      return successResponse(null, "العميل غير موجود");
    }
  } catch (error) {
    return handleError(error);
  }
}
