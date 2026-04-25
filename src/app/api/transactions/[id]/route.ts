import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import PaymentMethod from "@/models/PaymentMethod";
import Supplier from "@/models/Supplier";
import Customer from "@/models/Customer";
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const data = await Transaction.findById(id);
    if (!data) return errorResponse("Transaction not found", 404);
    return successResponse(data, "Transaction retrieved");
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const data = await Transaction.findByIdAndUpdate(id, body, {
      new: true,
    });
    if (!data) return errorResponse("Transaction not found", 404);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم تعديل معاملة مالية",
      actionType: "transaction_updated",
      createdBy: currentUser,
      severity: "warning",
      details: `تم تعديل المعاملة المالية رقم ${data._id} - ${data.description || "بدون وصف"}`,
      metadata: { transactionId: data._id, changes: body },
    });

    return successResponse(data, "Transaction updated");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    // Check if shift exists and is active (to prevent double-reverting)
    const transaction = await Transaction.findById(id);
    if (!transaction) return errorResponse("Transaction not found", 404);
    if (!transaction.isActive)
      return errorResponse("هذه المعاملة محذوفة بالفعل", 400);

    const data = await Transaction.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    // ========== REVERT FINANCIAL EFFECTS ==========
    const {
      amount,
      type,
      isExpense,
      paymentMethodId,
      relatedModel,
      relatedId,
    } = transaction;
    const isIncome = type === "income";

    // 1. Revert System Account
    const systemAccount = await Account.findOne({ accountType: "system" });
    if (systemAccount) {
      if (isIncome) {
        systemAccount.currentBalance -= amount;
        systemAccount.totalCredits -= amount;
      } else if (type === "payment") {
        systemAccount.currentBalance += amount;
        systemAccount.totalDebits -= amount;
      }
      await systemAccount.save();
    }

    // 2. Revert Payment Method (Wallet)
    if (paymentMethodId) {
      const wallet = await PaymentMethod.findById(paymentMethodId);
      if (wallet) {
        if (isIncome) {
          wallet.balance -= amount;
        } else if (type === "payment") {
          wallet.balance += amount;
        }
        await wallet.save();
      }
    }

    // 3. Revert Related Entity Balance
    if (relatedModel === "Supplier" && relatedId) {
      const supplier = await Supplier.findById(relatedId);
      if (supplier) {
        if (isIncome) {
          supplier.wallet -= amount;
        } else if (type === "payment") {
          supplier.wallet += amount;
        }
        await supplier.save();
      }
    } else if (relatedModel === "Customer" && relatedId) {
      const customer = await Customer.findById(relatedId);
      if (customer) {
        if (isIncome) {
          customer.totalPayments -= amount;
        } else if (type === "payment") {
          customer.totalPayments += amount;
        }
        await customer.save();
      }
    }

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم حذف معاملة مالية",
      actionType: "transaction_deleted",
      createdBy: currentUser,
      severity: "error",
      details: `تم حذف المعاملة المالية رقم ${data._id} - ${data.description || "بدون وصف"} (وتم استرجاع الرصيد)`,
      metadata: { transactionId: data._id, amount, wasIncome: isIncome },
    });

    return successResponse(data, "Transaction deleted");
  } catch (error) {
    return handleError(error);
  }
}
