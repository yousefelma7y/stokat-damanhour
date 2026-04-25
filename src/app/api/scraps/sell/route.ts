import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Scrap from "@/models/Scrap";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import PaymentMethod from "@/models/PaymentMethod";
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { product: scrapId, quantity, price, paymentMethodId } = body;

    if (!scrapId || !quantity || !price) {
      return errorResponse("بيانات غير مكتملة", 400);
    }

    const scrap = await Scrap.findById(scrapId);
    if (!scrap) {
      return errorResponse("المنتج التالف غير موجود", 404);
    }

    if (scrap.stock < quantity) {
      return errorResponse("الكمية المتاحة غير كافية", 400);
    }

    // 1. Update Scrap Stock
    scrap.stock -= quantity;
    await scrap.save();

    // 2. Financial Accounting
    let systemAccount = await Account.findOne({ accountType: "system" });
    if (!systemAccount) {
      systemAccount = await Account.create({
        accountName: "الحساب الرئيسي",
        accountType: "system",
        currentBalance: 0,
        currency: "EGP",
      });
    }

    systemAccount.currentBalance += Number(price);
    systemAccount.totalCredits =
      (systemAccount.totalCredits || 0) + Number(price);
    await systemAccount.save();

    // 2.5 Update Payment Method (Wallet) balance
    let walletName = "cash";
    if (paymentMethodId) {
      const wallet = await PaymentMethod.findById(paymentMethodId);
      if (wallet) {
        wallet.balance += Number(price);
        await wallet.save();
        walletName = wallet.name;
      }
    }

    // 3. Create Transaction
    const currentUser = await getCurrentUserName(request);
    await Transaction.create({
      transactionId: `TXN-SCRAP-SELL-${Date.now()}`,
      type: "income",
      category: "sales_scrap",
      from: "خردة",
      to: "system",
      amount: Number(price),
      gain: Number(price), // Scrap sales are considered pure gain
      balanceAfter: systemAccount.currentBalance,
      description: `بيع خردة: ${scrap.name} (كمية: ${quantity})`,
      status: "completed",
      relatedModel: "Scrap",
      relatedId: scrap._id,
      paymentMethod: walletName,
      paymentMethodId: paymentMethodId || null,
      createdBy: currentUser,
    });

    // 4. Log Activity
    await Activity.create({
      action: "تم بيع منتج تالف",
      actionType: "scrap_sold",
      createdBy: currentUser,
      severity: "success",
      details: `تم بيع ${quantity} من ${scrap.name} بسعر ${price} ج.م عبر ${walletName}`,
      metadata: { scrapId: scrap._id, quantity, price, paymentMethodId },
    });

    return successResponse(scrap, "تم عملية البيع بنجاح");
  } catch (error) {
    return handleError(error);
  }
}
