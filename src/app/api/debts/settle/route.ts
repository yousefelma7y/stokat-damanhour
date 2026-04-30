import { NextRequest } from "next/server";
import mongoose from "mongoose";
import Account from "@/models/Account";
import Activity from "@/models/Activity";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import PaymentMethod from "@/models/PaymentMethod";
import Transaction from "@/models/Transaction";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUserName } from "@/lib/get-current-user";
import { MONEY_EPSILON, roundMoney } from "@/lib/order-payments";
import { errorResponse, successResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    const body = await request.json();
    const customerId = Number(body.customerId);
    const paymentMethodId = Number(body.paymentMethodId);
    const amount = roundMoney(Number(body.amount || 0));
    const notes = body.notes || "";

    if (!customerId) return errorResponse("يجب تحديد العميل", 400);
    if (!paymentMethodId) return errorResponse("يجب تحديد وسيلة الدفع", 400);
    if (amount <= MONEY_EPSILON) return errorResponse("مبلغ التسوية يجب أن يكون أكبر من صفر", 400);

    const result = await session.withTransaction(async () => {
      const customer = await Customer.findOne({ _id: customerId, isActive: true }).session(session);
      const wallet = await PaymentMethod.findOne({ _id: paymentMethodId, isActive: true }).session(session);

      if (!customer) throw new Error(`العميل غير موجود (ID: ${customerId})`);
      if (!wallet) throw new Error("وسيلة الدفع غير موجودة");

      // Self-healing: If balance is 0 but we are trying to settle, or just to be safe,
      // recalculate from orders to ensure we have the latest truth.
      const debtOrdersCount = await Order.countDocuments({
        customer: customer._id,
        status: "completed",
        remainingAmount: { $gt: MONEY_EPSILON },
        isActive: true,
      }).session(session);

      let currentDebt = roundMoney(Number(customer.debtBalance || 0));

      if (currentDebt < amount && debtOrdersCount > 0) {
        // Recalculate truth from orders
        const orders = await Order.find({
          customer: customer._id,
          status: "completed",
          isActive: true,
          remainingAmount: { $gt: 0 }
        }).session(session);
        
        const actualDebt = orders.reduce((sum, o) => sum + (Number(o.remainingAmount) || 0), 0);
        currentDebt = roundMoney(actualDebt);
        
        // Update the customer record to match the orders truth
        customer.debtBalance = currentDebt;
        console.log(`[Self-Heal] Recalculated debt for ${customer.name}: ${currentDebt}`);
      }

      if (amount - currentDebt > MONEY_EPSILON) {
        throw new Error(`مبلغ التسوية (${amount}) أكبر من المديونية الحالية للعميل "${customer.name}" وهي (${currentDebt})`);
      }

      let systemAccount = await Account.findOne({ accountType: "system" }).session(session);
      if (!systemAccount) {
        [systemAccount] = await Account.create(
          [{ accountType: "system", entityName: "نظام ستوكات دمنهور", currentBalance: 0 }],
          { session }
        );
      }

      wallet.balance = roundMoney(Number(wallet.balance || 0) + amount);
      await wallet.save({ session });

      systemAccount.currentBalance = roundMoney(Number(systemAccount.currentBalance || 0) + amount);
      systemAccount.totalCredits = roundMoney(Number(systemAccount.totalCredits || 0) + amount);
      await systemAccount.save({ session });

      const currentUser = await getCurrentUserName(request);
      const transactionId = `TXN-DEBT-${customer._id}-${Date.now()}`;
      const [transaction] = await Transaction.create(
        [
          {
            transactionId,
            type: "income",
            category: "debt_settlement",
            from: `Customer: ${customer.name}`,
            to: "system",
            amount,
            gain: 0,
            balanceAfter: systemAccount.currentBalance,
            description: notes || `تسوية مديونية العميل ${customer.name} بقيمة ${amount} جنيه`,
            status: "completed",
            relatedModel: "Customer",
            relatedId: customer._id,
            paymentMethod: wallet.name,
            paymentMethodId: wallet._id,
            createdBy: currentUser,
          },
        ],
        { session }
      );

      let amountLeft = amount;
      const debtOrders = await Order.find({
        customer: customer._id,
        status: "completed",
        remainingAmount: { $gt: MONEY_EPSILON },
        isActive: true,
      })
        .sort({ createdAt: 1 })
        .session(session);

      for (const order of debtOrders) {
        if (amountLeft <= MONEY_EPSILON) break;

        const orderRemaining = roundMoney(Number(order.remainingAmount || 0));
        const appliedAmount = roundMoney(Math.min(orderRemaining, amountLeft));

        order.remainingAmount = roundMoney(orderRemaining - appliedAmount);
        order.paidAmount = roundMoney(Number(order.paidAmount || 0) + appliedAmount);
        order.debtStatus = order.remainingAmount <= MONEY_EPSILON ? "settled" : "partial";
        order.isDebt = order.remainingAmount > MONEY_EPSILON;
        order.debtSettlements = [
          ...(order.debtSettlements || []),
          {
            amount: appliedAmount,
            paymentMethodId: wallet._id,
            paymentMethod: wallet.name,
            transactionId: transaction.transactionId,
            notes,
            createdBy: currentUser,
            createdAt: new Date(),
          },
        ];

        await order.save({ session });
        amountLeft = roundMoney(amountLeft - appliedAmount);
      }

      // Update customer with $inc and $set for better transactional reliability
      await Customer.updateOne(
        { _id: customer._id },
        {
          $inc: {
            debtBalance: -amount,
            totalDebtPaid: amount,
            totalPayments: amount,
          },
          $set: { updatedAt: new Date() }
        },
        { session }
      );

      await Activity.create(
        [
          {
            action: "تسوية مديونية",
            actionType: "debt_settled",
            createdBy: currentUser,
            severity: "success",
            details: `تم تسوية ${amount} جنيه من مديونية العميل "${customer.name}"`,
            metadata: {
              customerId: customer._id,
              amount,
              paymentMethodId: wallet._id,
              transactionId: transaction._id,
            },
          },
        ],
        { session }
      );

      // Final truth sync: ensure the customer balance matches the sum of remaining orders
      const finalOrders = await Order.find({
        customer: customer._id,
        status: "completed",
        isActive: true,
        remainingAmount: { $gt: 0 }
      }).session(session);
      
      const finalActualDebt = finalOrders.reduce((sum, o) => sum + (Number(o.remainingAmount) || 0), 0);
      const roundedFinalDebt = roundMoney(finalActualDebt);
      
      await Customer.updateOne(
        { _id: customer._id },
        { $set: { debtBalance: roundedFinalDebt } },
        { session }
      );

      return { customer, transaction, finalDebt: roundedFinalDebt };
    });

    return successResponse(
      {
        customer: result.customer,
        transaction: result.transaction,
        remainingDebt: result.finalDebt,
      },
      "تم تسجيل تسوية المديونية بنجاح"
    );
  } catch (error: any) {
    return errorResponse(error.message || "فشل تسجيل تسوية المديونية", 400);
  } finally {
    session.endSession();
  }
}
