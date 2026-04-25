import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { successResponse, handleError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const stats = await Transaction.aggregate([
      { $match: { status: "completed" } }, // Filter for completed transactions
      {
        $group: {
          _id: null,
          totalIncome: {
            // Sum all GET/income transactions as POSITIVE (+)
            $sum: {
              $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
            },
          },
          totalExpenses: {
            // Sum all PAY/payment transactions as NEGATIVE (-)
            $sum: {
              $cond: [
                { $eq: ["$type", "payment"] },
                { $multiply: ["$amount", -1] },
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalIncome: 1,
          totalExpenses: 1,
          netBalance: { $add: ["$totalIncome", "$totalExpenses"] },
        },
      },
    ]);

    const result = stats[0] || {
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
    };

    return successResponse(result, "Transaction stats retrieved");
  } catch (error) {
    return handleError(error);
  }
}
