import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { successResponse, handleError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const reversalCategories = [
      "adjustment",
      "cancelled_order",
      "debt_settlement_refund",
    ];

    const stats = await Transaction.aggregate([
      { $match: { status: { $in: ["completed", "cancelled"] } } },
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
                        { $in: ["$category", reversalCategories] },
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
                    { $not: [{ $in: ["$category", reversalCategories] }] },
                    { $eq: ["$status", "completed"] },
                  ],
                },
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
