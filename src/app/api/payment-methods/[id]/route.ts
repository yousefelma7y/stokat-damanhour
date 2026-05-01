import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { PaymentMethod, Activity, Shift } from "@/models";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

const PAYMENT_TYPES = ["cash", "bank", "wallet", "other"] as const;
type PaymentMethodType = (typeof PAYMENT_TYPES)[number];
const MONEY_EPSILON = 0.01;

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

async function findActiveByName(name: string, excludeId: number) {
  return PaymentMethod.findOne({
    _id: { $ne: excludeId },
    isActive: true,
    name: { $regex: `^${escapeRegex(name)}$`, $options: "i" },
  });
}

function getDuplicateKeyMessage(error: any) {
  if (error?.code !== 11000) return "";
  return "توجد وسيلة دفع بنفس الاسم بالفعل";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const data = await PaymentMethod.findOne({
      _id: Number(resolvedParams.id),
      isActive: true,
    });
    if (!data) return errorResponse("Payment method not found", 404);
    return successResponse(data, "تم جلب وسيلة الدفع بنجاح");
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const body = await request.json();
    const id = Number(resolvedParams.id);
    if (!Number.isFinite(id) || id <= 0) {
      return errorResponse("وسيلة الدفع غير صالحة", 400);
    }

    const data = await PaymentMethod.findOne({ _id: id, isActive: true });
    if (!data) return errorResponse("Payment method not found", 404);

    const name = normalizeName(body.name);
    const type = normalizeType(body.type);

    if (!name) {
      return errorResponse("اسم وسيلة الدفع مطلوب", 400);
    }
    if (!type) {
      return errorResponse("نوع وسيلة الدفع غير صالح", 400);
    }

    const duplicate = await findActiveByName(name, id);
    if (duplicate) {
      return errorResponse("توجد وسيلة دفع بنفس الاسم بالفعل", 409);
    }

    data.name = name;
    data.type = type;
    await data.save();

    const currentUser = await getCurrentUserName(request);

    await Activity.create({
      action: "تم تحديث وسيلة دفع",
      actionType: "payment_method_updated",
      createdBy: currentUser,
      severity: "info",
      details: `تم تحديث وسيلة الدفع "${data.name}"`,
      metadata: { paymentMethodId: data._id, changes: { name, type } },
    });

    return successResponse(data, "تم تحديث وسيلة الدفع بنجاح");
  } catch (error) {
    const duplicateMessage = getDuplicateKeyMessage(error);
    if (duplicateMessage) return errorResponse(duplicateMessage, 409);
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (!Number.isFinite(id) || id <= 0) {
      return errorResponse("وسيلة الدفع غير صالحة", 400);
    }

    const data = await PaymentMethod.findOne({ _id: id, isActive: true });
    if (!data) return errorResponse("Payment method not found", 404);

    if (Math.abs(Number(data.balance || 0)) >= MONEY_EPSILON) {
      return errorResponse(
        "لا يمكن حذف وسيلة دفع بها رصيد. قم بتحويل أو تسوية الرصيد أولاً",
        400,
      );
    }

    const activeCount = await PaymentMethod.countDocuments({ isActive: true });
    if (activeCount <= 1) {
      return errorResponse("يجب الإبقاء على وسيلة دفع واحدة على الأقل", 400);
    }

    const activeShiftCount = await Shift.countDocuments({
      isActive: true,
      status: "active",
      $or: [
        { "startWallets.paymentMethodId": data._id },
        { "closeWallets.paymentMethodId": data._id },
      ],
    });
    if (activeShiftCount > 0) {
      return errorResponse(
        "لا يمكن حذف وسيلة الدفع لأنها مستخدمة في وردية مفتوحة",
        400,
      );
    }

    data.isActive = false;
    await data.save();

    const currentUser = await getCurrentUserName(request);

    await Activity.create({
      action: "تم حذف وسيلة دفع",
      actionType: "payment_method_deleted",
      createdBy: currentUser,
      severity: "warning",
      details: `تم حذف وسيلة الدفع "${data.name}"`,
      metadata: { paymentMethodId: data._id },
    });

    return successResponse(data, "تم حذف وسيلة الدفع بنجاح");
  } catch (error) {
    return handleError(error);
  }
}
