import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";
import { getTopCustomers, TopCustomer } from "@/lib/top-customers";
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
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ];
    }

    // withTop=1 → also return the top paying customers. When browsing (no search)
    // they are left out of the list so they only appear once, in their own section;
    // when searching they stay in the results, marked with their rank.
    let topCustomers: TopCustomer[] = [];
    if (searchParams.get("withTop")) {
      topCustomers = await getTopCustomers();
      if (!search && topCustomers.length > 0) {
        filter._id = { $nin: topCustomers.map((customer) => customer._id) };
      }
    }

    const skip = (page - 1) * limit;
    const total = await Customer.countDocuments(filter);
    const docs = await Customer.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const rankById = new Map(topCustomers.map((customer) => [customer._id, customer.rank]));
    const data =
      rankById.size > 0
        ? docs.map((doc) => ({ ...doc.toObject(), topRank: rankById.get(doc._id) || null }))
        : docs;

    return successResponse(data, "Customers retrieved", {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      ...(searchParams.get("withTop") ? { topCustomers } : {}),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const data = await Customer.create(body);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم إضافة عميل جديد",
      actionType: "customer_created",
      createdBy: currentUser,
      severity: "success",
      details: `تم إضافة العميل "${data.name}" بنجاح`,
      metadata: { customerId: data._id, phone: data.phone },
    });

    return successResponse(data, "Customer created");
  } catch (error) {
    return handleError(error);
  }
}
