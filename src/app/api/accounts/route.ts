import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Account from "@/models/Account";
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
      filter.$or = [{ entityName: { $regex: search, $options: "i" } }];
    }

    const skip = (page - 1) * limit;
    const total = await Account.countDocuments(filter);
    const data = await Account.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return successResponse(data, "Accounts retrieved", {
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
    const data = await Account.create(body);

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم إضافة حساب جديد",
      actionType: "account_created",
      createdBy: currentUser,
      severity: "success",
      details: `تم إضافة الحساب "${data.entityName}" بنجاح`,
      metadata: { accountId: data._id },
    });

    return successResponse(data, "Account created");
  } catch (error) {
    return handleError(error);
  }
}
