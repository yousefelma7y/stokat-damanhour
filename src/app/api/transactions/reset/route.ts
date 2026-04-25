import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Account from "@/models/Account";
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";
import { successResponse, handleError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Find and reset system account
    let systemAccount = await Account.findOne({ accountType: "system" });
    if (!systemAccount) {
      systemAccount = await Account.create({
        accountType: "system",
        entityName: "نظام ستوكات دمنهور",
        currentBalance: 0,
      });
    }

    // Store old balance for log
    const oldBalance = systemAccount.currentBalance;

    // Reset balance
    systemAccount.currentBalance = 0;
    systemAccount.totalCredits = 0;
    systemAccount.totalDebits = 0;

    await systemAccount.save();

    // Log activity
    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم إعادة تعيين الرصيد",
      actionType: "balance_reset",
      createdBy: currentUser,
      severity: "warning",
      details: `تم إعادة تعيين رصيد النظام من ${oldBalance} إلى 0`,
      metadata: { oldBalance, newBalance: 0 },
    });

    return successResponse(
      { previousBalance: oldBalance, newBalance: 0 },
      "Balance reset successfully",
    );
  } catch (error) {
    return handleError(error);
  }
}

// http://localhost:3000/api/transactions/reset
