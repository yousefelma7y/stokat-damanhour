import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import Supplier from "@/models/Supplier";
import PaymentMethod from "@/models/PaymentMethod";
import Customer from "@/models/Customer";
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
    const limit = parseInt(searchParams.get("limit") || "25");
    const search = searchParams.get("search") || "";

    const filter: any = { isActive: { $ne: false } };

    // 1. Search Query
    if (search) {
      filter.$or = [
        { transactionId: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { from: { $regex: search, $options: "i" } },
        { to: { $regex: search, $options: "i" } },
      ];
    }

    // 2. Payment Method Filter
    const paymentMethodId = searchParams.get("paymentMethodId");
    if (paymentMethodId) {
      filter.$or = [
        { paymentMethodId: Number(paymentMethodId) },
        { fromWallet: Number(paymentMethodId) },
        { toWallet: Number(paymentMethodId) },
      ];
    }

    // 3. Date Range Filter
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // 4. Type/Category Filter
    const type = searchParams.get("type");
    if (type) filter.type = type;

    const category = searchParams.get("category");
    if (category) filter.category = category;

    const createdBy = searchParams.get("createdBy");
    if (createdBy) filter.createdBy = createdBy;

    const skip = (page - 1) * limit;

    // Calculate stats for the filtered results
    const stats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalIncome: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$type", "income"] },
                    { $eq: ["$status", "completed"] },
                  ],
                },
                "$amount",
                {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$type", "payment"] },
                        { $eq: ["$category", "adjustment"] },
                        { $eq: ["$status", "completed"] },
                      ],
                    },
                    { $multiply: ["$amount", -1] },
                    0,
                  ],
                },
              ],
            },
          },
          totalExpenses: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$type", "payment"] },
                    { $ne: ["$category", "adjustment"] },
                    { $eq: ["$status", "completed"] },
                  ],
                },
                "$amount",
                0,
              ],
            },
          },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const filteredStats =
      stats.length > 0
        ? {
            totalIncome: stats[0].totalIncome,
            totalExpenses: stats[0].totalExpenses,
            netChange: stats[0].totalIncome - stats[0].totalExpenses,
            totalCount: stats[0].totalCount,
          }
        : {
            totalIncome: 0,
            totalExpenses: 0,
            netChange: 0,
            totalCount: 0,
          };

    const total = await Transaction.countDocuments(filter);
    const data = await Transaction.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return successResponse(data, "Transactions retrieved", {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      stats: filteredStats,
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const amount = Number(body.amount || 0);
    if (amount <= 0) {
      return errorResponse("المبلغ يجب أن يكون أكبر من صفر", 400);
    }

    const incomingType = body.type;

    // ========== HANDLE TRANSFER BETWEEN WALLETS ==========
    if (incomingType === "transfer") {
      const { fromWallet, toWallet, description } = body;

      if (!fromWallet || !toWallet) {
        return errorResponse("يجب تحديد المحفظة المصدر والمحفظة الهدف", 400);
      }
      if (fromWallet === toWallet) {
        return errorResponse("لا يمكن التحويل من محفظة لنفسها", 400);
      }

      const sourceWallet = await PaymentMethod.findById(fromWallet);
      const targetWallet = await PaymentMethod.findById(toWallet);

      if (!sourceWallet) {
        return errorResponse("المحفظة المصدر غير موجودة", 404);
      }
      if (!targetWallet) {
        return errorResponse("المحفظة الهدف غير موجودة", 404);
      }
      if (sourceWallet.balance < amount) {
        return errorResponse(
          `رصيد المحفظة "${sourceWallet.name}" غير كافي. الرصيد الحالي: ${sourceWallet.balance}`,
          400,
        );
      }

      // Update wallet balances
      sourceWallet.balance -= amount;
      targetWallet.balance += amount;
      await sourceWallet.save();
      await targetWallet.save();

      const currentUser = await getCurrentUserName(request);
      // Create transfer transaction
      const data = await Transaction.create({
        transactionId: `TXN-TRF-${Date.now()}`,
        type: "transfer",
        category: "transfer",
        isExpense: false,
        from: sourceWallet.name,
        to: targetWallet.name,
        amount,
        fromWallet: sourceWallet._id,
        toWallet: targetWallet._id,
        paymentMethod: `${sourceWallet.name} → ${targetWallet.name}`,
        paymentMethodId: sourceWallet._id,
        description:
          description ||
          `تحويل من ${sourceWallet.name} إلى ${targetWallet.name}`,
        status: "completed",
        createdBy: body.createdBy || currentUser,
      });

      await Activity.create({
        action: "تحويل بين المحافظ",
        actionType: "wallet_transfer",
        createdBy: currentUser,
        severity: "info",
        details: `تم تحويل ${amount} جنيه من "${sourceWallet.name}" إلى "${targetWallet.name}"`,
        metadata: {
          transactionId: data._id,
          amount,
          fromWallet: sourceWallet._id,
          toWallet: targetWallet._id,
        },
      });

      return successResponse(data, "تم التحويل بنجاح");
    }

    // ========== HANDLE INCOME / PAYMENT ==========

    // Ensure system account exists
    let systemAccount = await Account.findOne({ accountType: "system" });
    if (!systemAccount) {
      systemAccount = await Account.create({
        accountType: "system",
        entityName: "نظام ستوكات دمنهور",
        currentBalance: 0,
      });
    }

    let transactionType = incomingType;
    let isIncome = false;

    if (incomingType === "income" || incomingType === "get") {
      transactionType = "income";
      isIncome = true;
    } else if (
      incomingType === "payment" ||
      incomingType === "pay" ||
      incomingType === "expense"
    ) {
      transactionType = "payment";
      isIncome = false;
    } else {
      return errorResponse(
        "نوع المعاملة غير صالح. يجب أن يكون payment أو income أو get أو pay أو transfer",
        400,
      );
    }

    // Adjust system account balance
    if (isIncome) {
      systemAccount.currentBalance += amount;
      systemAccount.totalCredits += amount;
    } else {
      systemAccount.currentBalance -= amount;
      systemAccount.totalDebits += amount;
    }

    // Set transaction properties
    body.type = transactionType;
    body.category = isIncome ? "income" : "expense";
    body.isExpense = !isIncome;

    // ========== PAYMENT METHOD WALLET UPDATE ==========
    const paymentMethodId = body.paymentMethodId;
    if (paymentMethodId) {
      const wallet = await PaymentMethod.findById(paymentMethodId);
      if (wallet) {
        if (isIncome) {
          wallet.balance += amount;
        } else {
          wallet.balance -= amount;
        }
        await wallet.save();
        body.paymentMethod = wallet.name;
      }
    } else {
      // Fallback: if no payment method specified, default behavior
      body.paymentMethod = body.paymentMethod || "cash";
    }

    // Handle Supplier Wallet Update if related
    if (body.relatedModel === "Supplier" && body.relatedId) {
      const supplier = await Supplier.findById(body.relatedId);
      if (supplier) {
        if (isIncome) {
          supplier.wallet += amount;
        } else {
          supplier.wallet -= amount;
        }
        await supplier.save();
      }
    }

    // Handle Customer Total Payments Update if related
    if (body.relatedModel === "Customer" && body.relatedId) {
      const customer = await Customer.findById(body.relatedId);
      if (customer) {
        if (isIncome) {
          customer.totalPayments += amount;
        } else {
          customer.totalPayments -= amount;
        }
        await customer.save();
      }
    }

    await systemAccount.save();

    // Add balanceAfter to transaction
    body.balanceAfter = systemAccount.currentBalance;

    // Generate transactionId if not provided
    if (!body.transactionId) {
      body.transactionId = `TXN-MAN-${Date.now()}`;
    }

    // Default status to completed for manual transactions
    if (!body.status) {
      body.status = "completed";
    }

    // Set from/to for display purposes
    if (!body.from && !body.to) {
      if (isIncome) {
        body.from =
          body.relatedModel === "Supplier"
            ? `مورد #${body.relatedId}`
            : "طرف خارجي";
        body.to = "النظام";
      } else {
        body.from = "النظام";
        body.to =
          body.relatedModel === "Supplier"
            ? `مورد #${body.relatedId}`
            : "طرف خارجي";
      }
    }

    const currentUser = await getCurrentUserName(request);

    // Set createdBy if not already provided
    if (!body.createdBy) {
      body.createdBy = currentUser;
    }

    const data = await Transaction.create(body);

    await Activity.create({
      action: "تم إضافة معاملة مالية",
      actionType: "transaction_created",
      createdBy: currentUser,
      severity: "info",
      details: `تم إضافة عملية ${isIncome ? "تحصيل" : "صرف"} بقيمة ${amount} EGP ${body.paymentMethod ? `عبر ${body.paymentMethod}` : ""}`,
      metadata: { transactionId: data._id, category: body.category, amount },
    });

    return successResponse(data, "Transaction created");
  } catch (error) {
    return handleError(error);
  }
}
