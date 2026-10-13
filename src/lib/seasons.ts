import mongoose from "mongoose";
import Account from "@/models/Account";
import Activity from "@/models/Activity";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import PaymentMethod from "@/models/PaymentMethod";
import Product from "@/models/Product";
import Season, { ISeason, ISeasonBalances, ISeasonTotals } from "@/models/Season";
import Supplier from "@/models/Supplier";
import Transaction from "@/models/Transaction";
import WeightStockMovement from "@/models/WeightStockMovement";
import { getWeightMovementStats, getWeightStock, roundWeight } from "@/lib/weight-stock";

/**
 * Seasons split the books by date. A record belongs to the season whose
 * [startDate, endDate) range contains its createdAt, so nothing is ever moved
 * or deleted when a season closes: old records simply fall outside the
 * current season's range and become read-only.
 */

export const REVERSAL_CATEGORIES = [
  "adjustment",
  "cancelled_order",
  "debt_settlement_refund",
];

const money = (value: unknown) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export class SeasonError extends Error {
  status: number;
  details?: Record<string, unknown>;
  constructor(message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = "SeasonError";
    this.status = status;
    this.details = details;
  }
}

function isDuplicateKey(error: any) {
  return error?.code === 11000;
}

/** The open season. Creates the first season on first use. */
export async function getCurrentSeason(): Promise<ISeason> {
  const open = await Season.findOne({ status: "open" });
  if (open) return open;

  await Season.init(); // make sure the "one open season" index exists
  const [lastClosed, seasonsCount] = await Promise.all([
    Season.findOne({ status: "closed" }).sort({ endDate: -1 }),
    Season.countDocuments(),
  ]);

  let startDate = lastClosed?.endDate;
  if (!startDate) {
    // First season covers everything recorded so far.
    const firsts = await Promise.all([
      Transaction.findOne().sort({ createdAt: 1 }).select("createdAt").lean(),
      Order.findOne().sort({ createdAt: 1 }).select("createdAt").lean(),
      WeightStockMovement.findOne().sort({ createdAt: 1 }).select("createdAt").lean(),
    ]);
    const dates = firsts
      .map((doc: any) => doc?.createdAt)
      .filter(Boolean)
      .map((date: Date) => new Date(date).getTime());
    startDate = new Date(dates.length ? Math.min(...dates) : Date.now());
  }

  try {
    return await Season.create({
      name: `الموسم ${seasonsCount + 1}`,
      status: "open",
      startDate,
      opening: lastClosed?.closing || {},
      openedBy: "النظام",
    });
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    const existing = await Season.findOne({ status: "open" });
    if (!existing) throw error;
    return existing;
  }
}

/** Resolves a `season` query param: empty / "current" → open season, otherwise an id. */
export async function resolveSeason(param?: string | null) {
  const current = await getCurrentSeason();
  if (!param || param === "current" || Number(param) === current._id) {
    return { season: current, isCurrent: true };
  }

  const id = Number(param);
  const season = Number.isFinite(id) ? await Season.findById(id) : null;
  if (!season) throw new SeasonError("الموسم غير موجود", 404);
  return { season, isCurrent: season.status === "open" };
}

/** Inclusive date bounds of a season. `end` is null while the season is open. */
export function seasonBounds(season: Pick<ISeason, "startDate" | "endDate">) {
  return {
    start: new Date(season.startDate),
    end: season.endDate ? new Date(new Date(season.endDate).getTime() - 1) : null,
  };
}

export function seasonCreatedAt(season: Pick<ISeason, "startDate" | "endDate">) {
  const { start, end } = seasonBounds(season);
  return end ? { $gte: start, $lte: end } : { $gte: start };
}

/** Narrows an existing mongo filter (that may already have a createdAt range) to a season. */
export function applySeasonToFilter(
  filter: Record<string, any>,
  season: Pick<ISeason, "startDate" | "endDate">,
) {
  const { start, end } = seasonBounds(season);
  const existing = filter.createdAt || {};
  const createdAt: Record<string, Date> = { ...existing };

  const from = existing.$gte ? new Date(existing.$gte) : null;
  createdAt.$gte = from && from > start ? from : start;

  const to = existing.$lte ? new Date(existing.$lte) : null;
  if (end) createdAt.$lte = to && to < end ? to : end;

  filter.createdAt = createdAt;
  return filter;
}

/** Throws when a record dated `createdAt` belongs to a closed season. */
export async function assertSeasonUnlocked(createdAt: Date | string | undefined, label: string) {
  if (!createdAt) return;
  const current = await getCurrentSeason();
  if (new Date(createdAt) < new Date(current.startDate)) {
    throw new SeasonError(
      `${label} تابع لموسم مغلق ولا يمكن تعديله. سجّل التصحيح كعملية جديدة في الموسم الحالي.`,
      423,
    );
  }
}

/** Income / expenses / gain using the same rules as the dashboard. */
export async function aggregateTransactionTotals(match: Record<string, unknown>) {
  const [row] = await Transaction.aggregate([
    {
      $match: {
        ...match,
        isActive: { $ne: false },
        status: { $in: ["completed", "cancelled"] },
      },
    },
    {
      $group: {
        _id: null,
        income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
        reversals: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$type", "payment"] },
                  { $in: ["$category", REVERSAL_CATEGORIES] },
                ],
              },
              "$amount",
              0,
            ],
          },
        },
        expenses: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$type", "payment"] },
                  { $not: [{ $in: ["$category", REVERSAL_CATEGORIES] }] },
                ],
              },
              "$amount",
              0,
            ],
          },
        },
        gain: { $sum: { $ifNull: ["$gain", 0] } },
        debtCollected: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$type", "income"] },
                  { $eq: ["$category", "debt_settlement"] },
                ],
              },
              "$amount",
              0,
            ],
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const totalIncome = money((row?.income || 0) - (row?.reversals || 0));
  const totalExpenses = money(row?.expenses || 0);
  return {
    totalIncome,
    totalExpenses,
    netProfit: money(totalIncome - totalExpenses),
    totalGain: money(row?.gain || 0),
    debtCollected: money(row?.debtCollected || 0),
    transactionsCount: row?.count || 0,
  };
}

/** Activity inside a season. For an open season, pass nothing to compute up to now. */
export async function computeSeasonTotals(
  season: Pick<ISeason, "startDate" | "endDate">,
): Promise<ISeasonTotals> {
  const createdAt = seasonCreatedAt(season);

  const [transactions, [orders], weight] = await Promise.all([
    aggregateTransactionTotals({ createdAt }),
    Order.aggregate([
      { $match: { createdAt, isActive: true } },
      {
        $group: {
          _id: null,
          ordersCount: { $sum: 1 },
          completedOrders: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
          ordersValue: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, { $ifNull: ["$total", 0] }, 0] },
          },
          debtCreated: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, { $ifNull: ["$debtAmount", 0] }, 0],
            },
          },
        },
      },
    ]),
    getWeightMovementStats({ createdAt }),
  ]);

  return {
    totalIncome: transactions.totalIncome,
    totalExpenses: transactions.totalExpenses,
    netProfit: transactions.netProfit,
    totalGain: transactions.totalGain,
    transactionsCount: transactions.transactionsCount,
    debtCollected: transactions.debtCollected,
    ordersCount: orders?.ordersCount || 0,
    completedOrders: orders?.completedOrders || 0,
    cancelledOrders: orders?.cancelledOrders || 0,
    ordersValue: money(orders?.ordersValue),
    debtCreated: money(orders?.debtCreated),
    weightSoldKg: weight.soldKg,
    weightAddedKg: weight.addedKg,
    weightTransferredKg: weight.transferredKg,
    weightTransferValue: weight.transferValue,
  };
}

/** Live balances of everything that carries over to the next season. */
export async function computeLiveBalances(): Promise<ISeasonBalances> {
  const [systemAccount, wallets, [debts], [suppliers], weightStock, [products]] =
    await Promise.all([
      Account.findOne({ accountType: "system" }).lean(),
      PaymentMethod.find({ isActive: true }).sort({ _id: 1 }).lean(),
      Customer.aggregate([
        { $match: { isActive: true, debtBalance: { $gt: 0.01 } } },
        { $group: { _id: null, total: { $sum: "$debtBalance" }, count: { $sum: 1 } } },
      ]),
      Supplier.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$wallet", 0] } } } },
      ]),
      getWeightStock(),
      Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            qty: { $sum: { $ifNull: ["$stock", 0] } },
            value: {
              $sum: { $multiply: [{ $ifNull: ["$stock", 0] }, { $ifNull: ["$price", 0] }] },
            },
          },
        },
      ]),
    ]);

  const walletRows = wallets.map((wallet: any) => ({
    paymentMethodId: wallet._id,
    name: wallet.name,
    type: wallet.type,
    balance: money(wallet.balance),
  }));

  return {
    systemBalance: money((systemAccount as any)?.currentBalance),
    wallets: walletRows,
    walletsTotal: money(walletRows.reduce((sum, wallet) => sum + wallet.balance, 0)),
    customerDebt: money(debts?.total),
    customersWithDebt: debts?.count || 0,
    supplierWallets: money(suppliers?.total),
    weightStockKg: roundWeight(weightStock?.currentWeight || 0),
    productsCount: products?.count || 0,
    productsStockQty: products?.qty || 0,
    productsStockValue: money(products?.value),
  };
}

/** Things that must be resolved before the open season can be closed. */
export async function getCloseBlockers() {
  const pendingOrders = await Order.countDocuments({ isActive: true, status: "pending" });
  return { pendingOrders, canClose: pendingOrders === 0 };
}

/** Summary of a season: saved snapshot when closed, live numbers when open. */
export async function getSeasonSummary(season: ISeason) {
  if (season.status === "closed" && season.totals && season.closing) {
    return { totals: season.totals, balances: season.closing, isLive: false };
  }
  const [totals, balances] = await Promise.all([
    computeSeasonTotals(season),
    computeLiveBalances(),
  ]);
  return { totals, balances, isLive: true };
}

/**
 * Closes the open season and opens the next one.
 * Nothing is deleted: the season gets an end date and a saved summary, and the
 * closing balances become the next season's opening balances.
 */
export async function closeCurrentSeason({
  name,
  nextName,
  notes,
  closedBy,
}: {
  name?: string;
  nextName?: string;
  notes?: string;
  closedBy: string;
}) {
  const current = await getCurrentSeason();

  const blockers = await getCloseBlockers();
  if (!blockers.canClose) {
    throw new SeasonError(
      `يوجد ${blockers.pendingOrders} طلب معلق. أكمل الطلبات المعلقة أو ألغها قبل إقفال الموسم.`,
      409,
      blockers,
    );
  }

  const closing = await computeLiveBalances();
  const endDate = new Date();
  const totals = await computeSeasonTotals({ startDate: current.startDate, endDate });
  const seasonsCount = await Season.countDocuments();

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const closed = await Season.findOneAndUpdate(
      { _id: current._id, status: "open" },
      {
        $set: {
          status: "closed",
          endDate,
          closing,
          totals,
          closedBy,
          notes: notes || "",
          name: name?.trim() || current.name,
        },
      },
      { new: true, session },
    );
    if (!closed) throw new SeasonError("تم إقفال هذا الموسم بالفعل", 409);

    const [next] = await Season.create(
      [
        {
          name: nextName?.trim() || `الموسم ${seasonsCount + 1}`,
          status: "open",
          startDate: endDate,
          opening: closing,
          openedBy: closedBy,
        },
      ],
      { session, ordered: true },
    );

    await Activity.create(
      [
        {
          action: "إقفال موسم وبدء موسم جديد",
          actionType: "season_closed",
          createdBy: closedBy,
          severity: "warning",
          details: `تم إقفال "${closed.name}" (صافي الربح ${totals.netProfit} ج.م، ${totals.ordersCount} طلب) وبدء "${next.name}"`,
          metadata: { closedSeasonId: closed._id, newSeasonId: next._id, totals },
        },
      ],
      { session, ordered: true },
    );

    await session.commitTransaction();
    return { closed, next };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/** Whether the latest closed season can still be reopened (new season must be empty). */
export async function getReopenState() {
  const current = await getCurrentSeason();
  const lastClosed = await Season.findOne({ status: "closed" }).sort({ endDate: -1 });
  if (!lastClosed) return { seasonId: null, canReopen: false, activity: 0 };

  const createdAt = { $gte: current.startDate };
  const [transactions, orders, movements] = await Promise.all([
    Transaction.countDocuments({ createdAt }),
    Order.countDocuments({ createdAt }),
    WeightStockMovement.countDocuments({ createdAt }),
  ]);
  const activity = transactions + orders + movements;
  return { seasonId: lastClosed._id, canReopen: activity === 0, activity };
}

/** Undo a close made by mistake. Only allowed while the new season has no activity. */
export async function reopenLastSeason(seasonId: number, reopenedBy: string) {
  const state = await getReopenState();
  if (!state.seasonId || state.seasonId !== seasonId) {
    throw new SeasonError("يمكن إعادة فتح آخر موسم مغلق فقط", 400);
  }
  if (!state.canReopen) {
    throw new SeasonError(
      "لا يمكن إعادة فتح الموسم لأن الموسم الحالي يحتوي على عمليات بالفعل",
      409,
      state,
    );
  }

  const current = await getCurrentSeason();
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    await Season.deleteOne({ _id: current._id, status: "open" }, { session });
    const reopened = await Season.findOneAndUpdate(
      { _id: seasonId, status: "closed" },
      {
        $set: { status: "open" },
        $unset: { endDate: 1, closing: 1, totals: 1, closedBy: 1 },
      },
      { new: true, session },
    );
    if (!reopened) throw new SeasonError("الموسم غير موجود", 404);

    await Activity.create(
      [
        {
          action: "إعادة فتح موسم",
          actionType: "season_reopened",
          createdBy: reopenedBy,
          severity: "warning",
          details: `تم إعادة فتح "${reopened.name}" وحذف الموسم الفارغ "${current.name}"`,
          metadata: { seasonId: reopened._id, removedSeasonId: current._id },
        },
      ],
      { session, ordered: true },
    );

    await session.commitTransaction();
    return reopened;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
