import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PaymentMethod, Activity, Transaction } from "@/models";
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
    const search = searchParams.get("search") || "";
    const asOf = searchParams.get("asOf") || "";

    const filter: any = { isActive: true };
    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const data = await PaymentMethod.find(filter).sort({ createdAt: -1 });

    if (!asOf) {
      return successResponse(data, "Payment methods retrieved");
    }

    const asOfDate = new Date(asOf);
    if (Number.isNaN(asOfDate.getTime())) {
      return errorResponse("Invalid asOf date", 400);
    }

    // Treat the selected date as end-of-day snapshot
    asOfDate.setHours(23, 59, 59, 999);

    const walletIds = data
      .map((m: any) => Number(m._id))
      .filter((id: number) => Number.isFinite(id));

    if (!walletIds.length) {
      return successResponse(data, "Payment methods retrieved", {
        asOfDate: asOfDate.toISOString(),
      });
    }

    const transactionsAfterDate = await Transaction.find({
      isActive: { $ne: false },
      createdAt: { $gt: asOfDate },
      $or: [
        { paymentMethodId: { $in: walletIds } },
        { fromWallet: { $in: walletIds } },
        { toWallet: { $in: walletIds } },
      ],
    }).select("type amount isExpense paymentMethodId fromWallet toWallet");

    const postDateDeltaByWallet = new Map<string, number>();
    const addDelta = (walletId: number | string | null | undefined, delta: number) => {
      if (walletId === null || walletId === undefined) return;
      const key = String(walletId);
      postDateDeltaByWallet.set(key, (postDateDeltaByWallet.get(key) || 0) + delta);
    };

    for (const tx of transactionsAfterDate) {
      const amount = Number((tx as any).amount || 0);
      if (amount <= 0) continue;

      if ((tx as any).type === "transfer") {
        addDelta((tx as any).fromWallet, -amount);
        addDelta((tx as any).toWallet, amount);
        continue;
      }

      let sign = 0;
      if ((tx as any).type === "income") sign = 1;
      else if ((tx as any).type === "payment") sign = -1;
      else sign = (tx as any).isExpense ? -1 : 1;

      addDelta((tx as any).paymentMethodId, sign * amount);
    }

    const adjustedData = data.map((method: any) => {
      const methodObj = method.toObject ? method.toObject() : method;
      const currentBalance = Number(methodObj.balance || 0);
      const postDateDelta = postDateDeltaByWallet.get(String(methodObj._id)) || 0;

      const walletCreatedAt = methodObj.createdAt ? new Date(methodObj.createdAt) : null;
      const existedAtDate = !walletCreatedAt || walletCreatedAt <= asOfDate;

      return {
        ...methodObj,
        balanceAtDate: existedAtDate ? currentBalance - postDateDelta : 0,
      };
    });

    return successResponse(adjustedData, "Payment methods retrieved", {
      asOfDate: asOfDate.toISOString(),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const data = await PaymentMethod.create(body);

    const currentUser = await getCurrentUserName(request);

    await Activity.create({
      action: "تم إضافة وسيلة دفع جديدة",
      actionType: "payment_method_created",
      createdBy: currentUser,
      severity: "success",
      details: `تم إضافة وسيلة الدفع "${data.name}" برصيد إفتتاحي ${data.balance}`,
      metadata: { paymentMethodId: data._id },
    });

    return successResponse(data, "Payment method created");
  } catch (error) {
    return handleError(error);
  }
}
