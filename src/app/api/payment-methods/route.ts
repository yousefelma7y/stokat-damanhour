import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PaymentMethod, Activity, Transaction } from "@/models";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

const PAYMENT_TYPES = ["cash", "bank", "wallet", "other"] as const;
type PaymentMethodType = (typeof PAYMENT_TYPES)[number];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeName(value: unknown) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeType(value: unknown): PaymentMethodType | "" {
  const type = String(value || "cash").trim();
  return PAYMENT_TYPES.includes(type as PaymentMethodType)
    ? (type as PaymentMethodType)
    : "";
}

async function findActiveByName(name: string) {
  return PaymentMethod.findOne({
    isActive: true,
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
  });
}

function getDuplicateKeyMessage(error: any) {
  if (error?.code !== 11000) return "";
  return "توجد وسيلة دفع بنفس الاسم بالفعل";
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const asOf = searchParams.get("asOf") || "";
    const includeInactive = searchParams.get("includeInactive") === "true";

    const filter: any = includeInactive ? {} : { isActive: true };
    if (search) {
      const searchConditions: any[] = [
        { name: { $regex: escapeRegex(search.trim()), $options: "i" } },
      ];
      if (!Number.isNaN(Number(search))) {
        searchConditions.push({ _id: Number(search) });
      }
      filter.$or = searchConditions;
    }

    const data = await PaymentMethod.find(filter).sort({ createdAt: -1 });

    if (!asOf) {
      return successResponse(data, "تم جلب وسائل الدفع بنجاح");
    }

    const asOfDate = new Date(asOf);
    if (Number.isNaN(asOfDate.getTime())) {
      return errorResponse("تاريخ الرصيد غير صالح", 400);
    }

    // Treat the selected date as end-of-day snapshot
    asOfDate.setHours(23, 59, 59, 999);

    const walletIds = data
      .map((m: any) => Number(m._id))
      .filter((id: number) => Number.isFinite(id));

    if (!walletIds.length) {
      return successResponse(data, "تم جلب وسائل الدفع بنجاح", {
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
    const addDelta = (
      walletId: number | string | null | undefined,
      delta: number,
    ) => {
      if (walletId === null || walletId === undefined) return;
      const key = String(walletId);
      postDateDeltaByWallet.set(
        key,
        (postDateDeltaByWallet.get(key) || 0) + delta,
      );
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
      const postDateDelta =
        postDateDeltaByWallet.get(String(methodObj._id)) || 0;

      const walletCreatedAt = methodObj.createdAt
        ? new Date(methodObj.createdAt)
        : null;
      const existedAtDate = !walletCreatedAt || walletCreatedAt <= asOfDate;

      return {
        ...methodObj,
        balanceAtDate: existedAtDate ? currentBalance - postDateDelta : 0,
      };
    });

    return successResponse(adjustedData, "تم جلب وسائل الدفع بنجاح", {
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
    const name = normalizeName(body.name);
    const type = normalizeType(body.type);
    const balance = Number(body.balance ?? 0);

    if (!name) {
      return errorResponse("اسم وسيلة الدفع مطلوب", 400);
    }
    if (!type) {
      return errorResponse("نوع وسيلة الدفع غير صالح", 400);
    }
    if (!Number.isFinite(balance) || balance < 0) {
      return errorResponse("الرصيد الافتتاحي يجب أن يكون رقم أكبر من أو يساوي صفر", 400);
    }

    const duplicate = await findActiveByName(name);
    if (duplicate) {
      return errorResponse("توجد وسيلة دفع بنفس الاسم بالفعل", 409);
    }

    const inactiveMethod = await PaymentMethod.findOne({
      isActive: false,
      name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
    }).sort({ updatedAt: -1 });

    let data;
    let restored = false;
    if (inactiveMethod) {
      inactiveMethod.name = name;
      inactiveMethod.type = type;
      inactiveMethod.balance = balance;
      inactiveMethod.isActive = true;
      data = await inactiveMethod.save();
      restored = true;
    } else {
      data = await PaymentMethod.create({ name, type, balance });
    }

    const currentUser = await getCurrentUserName(request);

    await Activity.create({
      action: restored ? "تم تفعيل وسيلة دفع" : "تم إضافة وسيلة دفع جديدة",
      actionType: restored
        ? "payment_method_restored"
        : "payment_method_created",
      createdBy: currentUser,
      severity: "success",
      details: `تم إضافة وسيلة الدفع "${data.name}" برصيد إفتتاحي ${data.balance}`,
      metadata: { paymentMethodId: data._id },
    });

    return successResponse(data, "تم حفظ وسيلة الدفع بنجاح");
  } catch (error) {
    const duplicateMessage = getDuplicateKeyMessage(error);
    if (duplicateMessage) return errorResponse(duplicateMessage, 409);
    return handleError(error);
  }
}
