import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Account from "@/models/Account";
import { successResponse, handleError } from "@/lib/api-response";
import {
  startOfDay,
  endOfDay,
  subDays,
  format,
  eachDayOfInterval,
} from "date-fns";

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const endDate = endDateParam
      ? endOfDay(new Date(endDateParam))
      : endOfDay(new Date());
    const startDate = startDateParam
      ? startOfDay(new Date(startDateParam))
      : startOfDay(subDays(endDate, 30));

    // 0. Get Transactions within range
    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: "completed",
    }).sort({ createdAt: 1 });

    // 1. Calculate financial sums from Transactions
    // We rely ONLY on transactions to avoid double counting and ensure cash-flow accuracy.
    let totalIncome = 0; // Sum of income TXNs - adjustment payment TXNs
    let totalExpenses = 0; // Sum of non-adjustment payment TXNs
    let totalGain = 0; // Net gain from all TXNs

    transactions.forEach((t) => {
      if (t.type === "income") {
        totalIncome += t.amount || 0;
      } else if (t.type === "payment") {
        if (t.category === "adjustment") {
          // Adjustments (like order reverts) subtract from income rather than increasing expenses
          totalIncome -= t.amount || 0;
        } else {
          totalExpenses += t.amount || 0;
        }
      }
      totalGain += t.gain || 0;
    });

    const netProfit = totalIncome - totalExpenses;

    // 2. Get Orders within range (for counts and order value)
    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      isActive: true,
    });

    const totalOrders = orders.length;
    const completedOrdersList = orders.filter((o) => o.status === "completed");
    const completedOrders = completedOrdersList.length;
    const ordersValue = completedOrdersList.reduce(
      (sum, o) => sum + (o.total || 0),
      0,
    );

    // 3. Current Stock Status (snapshot)
    const products = await Product.find({ isActive: true });
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.stock * (p.price || 0),
      0,
    );
    const totalRetailValue = products.reduce(
      (sum, p) => sum + p.stock * (p.price || 0),
      0,
    );
    const lowStockCount = products.filter(
      (p) => p.stock <= (p.minStock || 10),
    ).length;

    // 4. System Balance
    const systemAccount = await Account.findOne({ accountType: "system" });
    const currentBalance = systemAccount?.currentBalance || 0;

    // 5. Daily Data for Charts and Export
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyDataMap = new Map();

    dateInterval.forEach((day) => {
      const d = format(day, "yyyy-MM-dd");
      dailyDataMap.set(d, {
        date: d,
        income: 0,
        expenses: 0,
        orders: 0,
        ordersValue: 0,
        gain: 0,
      });
    });

    transactions.forEach((t) => {
      const d = format(t.createdAt, "yyyy-MM-dd");
      if (dailyDataMap.has(d)) {
        const item = dailyDataMap.get(d);
        if (t.type === "income") {
          item.income += t.amount || 0;
        } else if (t.type === "payment") {
          if (t.category === "adjustment") {
            item.income -= t.amount || 0; // Subtract from income
          } else {
            item.expenses += t.amount || 0;
          }
        }
        item.gain += t.gain || 0;
      }
    });

    orders.forEach((o) => {
      const d = format(o.createdAt, "yyyy-MM-dd");
      if (dailyDataMap.has(d)) {
        const item = dailyDataMap.get(d);
        item.orders += 1;
        item.ordersValue += o.total || 0;
        // NOTE: We NO LONGER add o.paidAmount here to avoid double counting with transactions
      }
    });

    const dailyStats = Array.from(dailyDataMap.values());

    // 6. Latest Transactions
    const latestTransactions = await Transaction.find({})
      .sort({ createdAt: -1 })
      .limit(8);

    const lowStockProducts = products
      .filter((p) => p.stock <= (p.minStock || 10))
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 8); // top 8 low stock

    return successResponse(
      {
        summary: {
          totalIncome,
          totalExpenses,
          netProfit,
          systemBalance: currentBalance,
          totalOrders,
          ordersValue,
          completedOrders,
          inventoryValue: totalInventoryValue,
          retailValue: totalRetailValue,
          lowStockCount,
          totalGain,
          totalProductsCount: products.length,
          activeProductsCount: products.filter((p) => p.isActive).length,
        },
        lowStockProducts,
        dailyStats,
        recentTransactions: latestTransactions,
      },
      "Dashboard stats retrieved",
    );
  } catch (error) {
    return handleError(error);
  }
}
