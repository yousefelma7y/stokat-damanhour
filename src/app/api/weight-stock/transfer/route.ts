import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/get-current-user";
import { roundMoney } from "@/lib/order-payments";
import Account from "@/models/Account";
import PaymentMethod from "@/models/PaymentMethod";
import Shop from "@/models/Shop";
import Transaction from "@/models/Transaction";
import {
  formatKg,
  logWeightActivity,
  moveWeightStock,
  roundWeight,
} from "@/lib/weight-stock";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Move weight from storage to another shop.
 * body: { shopId? | shopName?, weight, price?, notes?, isCollected?, paymentMethodId? }
 */
export async function POST(request: NextRequest) {
  await connectDB();
  const user = await getCurrentUser(request);
  if (user?.role !== "admin") {
    return errorResponse("غير مصرح لك بنقل مخزون الوزن", 403);
  }

  const body = await request.json();
  const createdBy = user.userName || "النظام";
  const weight = roundWeight(Number(body.weight));
  const price = roundMoney(Number(body.price || 0));
  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  const isCollected = Boolean(body.isCollected) && price > 0;
  const shopName = typeof body.shopName === "string" ? body.shopName.trim() : "";

  if (!Number.isFinite(weight) || weight <= 0) {
    return errorResponse("أدخل وزن صحيح للنقل", 400);
  }
  if (!Number.isFinite(price) || price < 0) {
    return errorResponse("السعر يجب أن يكون رقم موجب", 400);
  }
  if (!body.shopId && !shopName) {
    return errorResponse("اختر المحل المنقول إليه", 400);
  }
  if (isCollected && !body.paymentMethodId) {
    return errorResponse("اختر وسيلة الدفع لتحصيل المبلغ", 400);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let shop = body.shopId
      ? await Shop.findOne({ _id: Number(body.shopId), isActive: true }).session(session)
      : await Shop.findOne({
          name: { $regex: `^${escapeRegex(shopName)}$`, $options: "i" },
          isActive: true,
        }).session(session);

    if (!shop && body.shopId) {
      throw Object.assign(new Error("المحل غير موجود"), { status: 404 });
    }
    if (!shop) {
      [shop] = await Shop.create([{ name: shopName }], { session, ordered: true });
    }

    let paymentMethod = null;
    if (isCollected) {
      paymentMethod = await PaymentMethod.findOne({
        _id: Number(body.paymentMethodId),
        isActive: true,
      }).session(session);
      if (!paymentMethod) {
        throw Object.assign(new Error("وسيلة الدفع غير موجودة"), { status: 404 });
      }
    }

    const { stock, movement } = await moveWeightStock({
      type: "transfer",
      weight,
      createdBy,
      session,
      movement: {
        shop: shop._id,
        shopName: shop.name,
        price,
        isCollected,
        paymentMethodId: paymentMethod?._id,
        paymentMethod: paymentMethod?.name,
        notes,
      },
    });

    let transaction = null;
    if (isCollected && paymentMethod) {
      await PaymentMethod.updateOne(
        { _id: paymentMethod._id },
        { $inc: { balance: price } },
        { session },
      );

      let systemAccount = await Account.findOne({ accountType: "system" }).session(session);
      if (!systemAccount) {
        systemAccount = new Account({
          accountType: "system",
          entityName: "نظام ستوكات دمنهور",
          currentBalance: 0,
        });
      }
      systemAccount.currentBalance = roundMoney(
        Number(systemAccount.currentBalance || 0) + price,
      );
      systemAccount.totalCredits = roundMoney(
        Number(systemAccount.totalCredits || 0) + price,
      );
      await systemAccount.save({ session });

      [transaction] = await Transaction.create(
        [
          {
            transactionId: `TXN-WTR-${movement._id}-${Date.now()}`,
            type: "income",
            category: "weight_transfer",
            isExpense: false,
            from: `محل: ${shop.name}`,
            to: "system",
            amount: price,
            gain: price,
            balanceAfter: systemAccount.currentBalance,
            description: `نقل ${formatKg(weight)} وزن إلى ${shop.name}${notes ? ` — ${notes}` : ""}`,
            status: "completed",
            relatedModel: "WeightStockMovement",
            relatedId: movement._id,
            paymentMethod: paymentMethod.name,
            paymentMethodId: paymentMethod._id,
            createdBy,
          },
        ],
        { session, ordered: true },
      );

      movement.transactionId = transaction._id;
      await movement.save({ session });
    }

    await logWeightActivity(
      {
        action: "نقل وزن إلى محل",
        actionType: "weight_stock_transfer",
        severity: "info",
        details: `تم نقل ${formatKg(weight)} إلى "${shop.name}"${price > 0 ? ` بقيمة ${price} ج.م${isCollected ? ` (تم التحصيل عبر ${paymentMethod?.name})` : " (غير محصلة)"}` : ""} — الرصيد المتبقي ${formatKg(stock.currentWeight)}`,
        metadata: {
          movementId: movement._id,
          shopId: shop._id,
          weight,
          price,
          transactionId: transaction?._id,
        },
        createdBy,
      },
      session,
    );

    await session.commitTransaction();
    return successResponse({ stock, movement, transaction }, "تم نقل الوزن بنجاح");
  } catch (error: any) {
    await session.abortTransaction();
    if (error?.name === "InsufficientWeightError" || error?.status) {
      return errorResponse(error.message, error.status || 400);
    }
    return handleError(error);
  } finally {
    session.endSession();
  }
}
