import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/get-current-user";
import { roundMoney } from "@/lib/order-payments";
import Account from "@/models/Account";
import PaymentMethod from "@/models/PaymentMethod";
import Transaction from "@/models/Transaction";
import WeightStockMovement from "@/models/WeightStockMovement";
import { formatKg, logWeightActivity, moveWeightStock } from "@/lib/weight-stock";
import { assertSeasonUnlocked } from "@/lib/seasons";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** Cancels a transfer: weight goes back to storage and any collected money is reversed. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await connectDB();

  const user = await getCurrentUser(request);
  if (user?.role !== "admin") {
    return errorResponse("غير مصرح لك بإلغاء عمليات النقل", 403);
  }
  const createdBy = user.userName || "النظام";

  let reason = "";
  try {
    const body = await request.json();
    reason = typeof body?.reason === "string" ? body.reason.trim() : "";
  } catch {
    // body is optional
  }

  try {
    const target = await WeightStockMovement.findById(Number(id)).select("createdAt");
    await assertSeasonUnlocked(target?.createdAt, "عملية النقل");
  } catch (error: any) {
    if (error?.name === "SeasonError") return errorResponse(error.message, error.status);
    return handleError(error);
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Flip status first so two concurrent cancels can't both return the weight.
    const original = await WeightStockMovement.findOneAndUpdate(
      { _id: Number(id), type: "transfer", status: "completed" },
      { $set: { status: "cancelled" } },
      { new: true, session },
    );
    if (!original) {
      throw Object.assign(new Error("عملية النقل غير موجودة أو ملغاة بالفعل"), {
        status: 404,
      });
    }

    const { stock, movement } = await moveWeightStock({
      type: "transfer_cancel",
      weight: original.weight,
      createdBy,
      session,
      movement: {
        shop: original.shop,
        shopName: original.shopName,
        price: original.price,
        relatedMovementId: original._id,
        notes: `إلغاء نقل رقم #${original._id}${reason ? ` — ${reason}` : ""}`,
      },
    });

    const amount = roundMoney(Number(original.price || 0));
    if (original.isCollected && amount > 0) {
      if (original.paymentMethodId) {
        await PaymentMethod.updateOne(
          { _id: original.paymentMethodId },
          { $inc: { balance: -amount } },
          { session },
        );
      }

      const systemAccount = await Account.findOne({ accountType: "system" }).session(session);
      if (systemAccount) {
        systemAccount.currentBalance = roundMoney(
          Number(systemAccount.currentBalance || 0) - amount,
        );
        systemAccount.totalDebits = roundMoney(
          Number(systemAccount.totalDebits || 0) + amount,
        );
        await systemAccount.save({ session });
      }

      // "adjustment" is treated as an income reversal by the accounting stats.
      const [reversal] = await Transaction.create(
        [
          {
            transactionId: `TXN-WTR-CNL-${original._id}-${Date.now()}`,
            type: "payment",
            category: "adjustment",
            isExpense: true,
            from: "system",
            to: `محل: ${original.shopName}`,
            amount,
            gain: -amount,
            balanceAfter: systemAccount?.currentBalance || 0,
            description: `إلغاء نقل ${formatKg(original.weight)} وزن إلى ${original.shopName}`,
            status: "completed",
            relatedModel: "WeightStockMovement",
            relatedId: original._id,
            paymentMethod: original.paymentMethod,
            paymentMethodId: original.paymentMethodId,
            createdBy,
          },
        ],
        { session, ordered: true },
      );
      movement.transactionId = reversal._id;
      await movement.save({ session });
    }

    await logWeightActivity(
      {
        action: "إلغاء نقل وزن",
        actionType: "weight_stock_transfer_cancelled",
        severity: "warning",
        details: `تم إلغاء نقل ${formatKg(original.weight)} إلى "${original.shopName}" وإرجاعها للمخزن — الرصيد الحالي ${formatKg(stock.currentWeight)}`,
        metadata: { movementId: original._id, cancelMovementId: movement._id, reason },
        createdBy,
      },
      session,
    );

    await session.commitTransaction();
    return successResponse({ stock, movement }, "تم إلغاء النقل وإرجاع الوزن للمخزن");
  } catch (error: any) {
    await session.abortTransaction();
    if (error?.status) return errorResponse(error.message, error.status);
    return handleError(error);
  } finally {
    session.endSession();
  }
}
