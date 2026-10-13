import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Account from "@/models/Account";
import WeightStockMovement from "@/models/WeightStockMovement";
import {
  getWeightMovementStats,
  getWeightStock,
  roundWeight,
} from "@/lib/weight-stock";
import { successResponse, errorResponse, handleError } from "@/lib/api-response";
import { resolveSeason, seasonBounds } from "@/lib/seasons";
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

    // Everything on this endpoint is scoped to one season (the open one by default).
    // scope=season → totals for the whole season instead of the last 30 days.
    const { season, isCurrent } = await resolveSeason(searchParams.get("season"));
    const bounds = seasonBounds(season);
    const wholeSeason = searchParams.get("scope") === "season" || !isCurrent;

    let endDate = endDateParam
      ? endOfDay(new Date(endDateParam))
      : endOfDay(new Date());
    if (bounds.end && endDate > bounds.end) endDate = bounds.end;

    let startDate = startDateParam
      ? startOfDay(new Date(startDateParam))
      : wholeSeason
        ? bounds.start
        : startOfDay(subDays(endDate, 30));
    if (startDate < bounds.start) startDate = bounds.start;
    if (startDate > endDate) startDate = endDate;
    const reversalCategories = [
      "adjustment",
      "cancelled_order",
      "debt_settlement_refund",
    ];

    // 0. Get Transactions within range
    const transactions = await Transaction.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ["completed", "cancelled"] },
      isActive: { $ne: false }, // deleted transactions already had their effect reverted
    }).sort({ createdAt: 1 });

    // 1. Calculate financial sums from Transactions
    // We rely ONLY on transactions to avoid double counting and ensure cash-flow accuracy.
    let totalIncome = 0; // Sum of income TXNs - adjustment payment TXNs
    let totalExpenses = 0; // Sum of non-adjustment payment TXNs
    let totalGain = 0; // Net gain from all TXNs

    transactions.forEach((t) => {
      const isReversal = reversalCategories.includes(t.category || "");
      if (t.type === "income") {
        totalIncome += t.amount || 0;
      } else if (t.type === "payment") {
        if (isReversal) {
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
    // 4. System Balance (live for the open season, saved closing balance for a closed one)
    const systemAccount = await Account.findOne({ accountType: "system" });
    const currentBalance = isCurrent
      ? systemAccount?.currentBalance || 0
      : season.closing?.systemBalance || 0;

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
        weightSold: 0,
        weightTransferred: 0,
      });
    });

    transactions.forEach((t) => {
      const d = format(t.createdAt, "yyyy-MM-dd");
      if (dailyDataMap.has(d)) {
        const item = dailyDataMap.get(d);
        const isReversal = reversalCategories.includes(t.category || "");
        if (t.type === "income") {
          item.income += t.amount || 0;
        } else if (t.type === "payment") {
          if (isReversal) {
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

    // 5b. Weight storage (snapshot + movements in range)
    const weightRange = { createdAt: { $gte: startDate, $lte: endDate } };
    const [weightStock, weightStats, weightMovements] = await Promise.all([
      getWeightStock(),
      getWeightMovementStats(weightRange),
      WeightStockMovement.find({
        ...weightRange,
        type: { $in: ["sale", "sale_return", "transfer"] },
      })
        .select("type status weight createdAt")
        .lean(),
    ]);

    weightMovements.forEach((m: any) => {
      const item = dailyDataMap.get(format(m.createdAt, "yyyy-MM-dd"));
      if (!item) return;
      if (m.type === "sale") item.weightSold += m.weight;
      if (m.type === "sale_return") item.weightSold -= m.weight;
      if (m.type === "transfer" && m.status === "completed") {
        item.weightTransferred += m.weight;
      }
    });
    dailyDataMap.forEach((item) => {
      item.weightSold = roundWeight(item.weightSold);
      item.weightTransferred = roundWeight(item.weightTransferred);
    });

    const dailyStats = Array.from(dailyDataMap.values());

    // 6. Latest Transactions
    const latestTransactions = await Transaction.find({
      createdAt: { $gte: bounds.start, ...(bounds.end ? { $lte: bounds.end } : {}) },
      isActive: { $ne: false },
    })
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
          // Stock is a live snapshot; a closed season shows what was saved at close.
          inventoryValue: isCurrent
            ? totalInventoryValue
            : season.closing?.productsStockValue || 0,
          retailValue: isCurrent
            ? totalRetailValue
            : season.closing?.productsStockValue || 0,
          lowStockCount: isCurrent ? lowStockCount : 0,
          totalGain,
          totalProductsCount: products.length,
          activeProductsCount: products.filter((p) => p.isActive).length,
        },
        season: {
          _id: season._id,
          name: season.name,
          status: season.status,
          startDate: season.startDate,
          endDate: season.endDate || null,
          isCurrent,
          opening: season.opening,
        },
        range: { startDate, endDate },
        lowStockProducts: isCurrent ? lowStockProducts : [],
        weightStock: {
          currentWeight: isCurrent
            ? weightStock?.currentWeight || 0
            : season.closing?.weightStockKg || 0,
          lowStockThreshold: weightStock?.lowStockThreshold || 0,
          isLow:
            isCurrent &&
            Number(weightStock?.currentWeight || 0) <=
              Number(weightStock?.lowStockThreshold || 0),
          ...weightStats,
        },
        dailyStats,
        recentTransactions: latestTransactions,
      },
      "Dashboard stats retrieved",
    );
  } catch (error: any) {
    if (error?.name === "SeasonError") {
      return errorResponse(error.message, error.status);
    }
    return handleError(error);
  }
}
