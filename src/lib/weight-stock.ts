import mongoose from "mongoose";
import Activity from "@/models/Activity";
import WeightStock from "@/models/WeightStock";
import WeightStockMovement, {
  WeightMovementType,
} from "@/models/WeightStockMovement";

type Session = mongoose.ClientSession | null | undefined;

const STOCK_KEY = "main";
const EPSILON = 0.0005; // half a gram

export function roundWeight(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 1000) / 1000;
}

export function formatKg(value: number) {
  return `${roundWeight(value).toLocaleString("en-US", {
    maximumFractionDigits: 3,
  })} كجم`;
}

export function sumWeightItems(items: any[] = []) {
  return roundWeight(
    items.reduce((sum, item) => sum + Number(item?.weight || 0), 0),
  );
}

// Which lifetime counter each movement type moves, and in which direction.
const COUNTER_EFFECTS: Partial<
  Record<WeightMovementType, { field: string; sign: 1 | -1 }>
> = {
  add: { field: "totalAdded", sign: 1 },
  sale: { field: "totalSold", sign: 1 },
  sale_return: { field: "totalSold", sign: -1 },
  transfer: { field: "totalTransferred", sign: 1 },
  transfer_cancel: { field: "totalTransferred", sign: -1 },
};

const DIRECTIONS: Record<WeightMovementType, "in" | "out"> = {
  add: "in",
  deduct: "out",
  adjust: "in", // overridden by the actual difference
  sale: "out",
  sale_return: "in",
  transfer: "out",
  transfer_cancel: "in",
};

export async function getWeightStock(session?: Session) {
  return WeightStock.findOneAndUpdate(
    { key: STOCK_KEY },
    { $setOnInsert: { key: STOCK_KEY } },
    { upsert: true, new: true, session: session || undefined },
  );
}

export class InsufficientWeightError extends Error {
  available: number;
  constructor(required: number, available: number) {
    super(
      `مخزون الوزن غير كافٍ. المطلوب ${formatKg(required)} والمتاح ${formatKg(available)}`,
    );
    this.name = "InsufficientWeightError";
    this.available = available;
  }
}

interface MoveOptions {
  type: Exclude<WeightMovementType, "adjust">;
  weight: number; // positive kg
  createdBy?: string;
  session?: Session;
  allowNegative?: boolean;
  movement?: Record<string, unknown>; // extra fields stored on the movement
}

/**
 * Atomically moves weight in/out of storage and records the movement.
 * Outgoing moves fail with InsufficientWeightError unless allowNegative is set.
 */
export async function moveWeightStock({
  type,
  weight,
  createdBy,
  session,
  allowNegative = false,
  movement = {},
}: MoveOptions) {
  const amount = roundWeight(Math.abs(Number(weight || 0)));
  if (amount <= 0) throw new Error("الوزن يجب أن يكون أكبر من صفر");

  const direction = DIRECTIONS[type];
  const delta = direction === "in" ? amount : -amount;

  await getWeightStock(session);

  const filter: Record<string, unknown> = { key: STOCK_KEY };
  if (direction === "out" && !allowNegative) {
    filter.currentWeight = { $gte: amount - EPSILON };
  }

  const counter = COUNTER_EFFECTS[type];
  const set: Record<string, unknown> = {
    currentWeight: { $round: [{ $add: ["$currentWeight", delta] }, 3] },
    updatedBy: createdBy,
  };
  if (counter) {
    set[counter.field] = {
      $round: [
        { $add: [{ $ifNull: [`$${counter.field}`, 0] }, counter.sign * amount] },
        3,
      ],
    };
  }

  const stock = await WeightStock.findOneAndUpdate(filter, [{ $set: set }], {
    new: true,
    session: session || undefined,
  });

  if (!stock) {
    const current = await getWeightStock(session);
    throw new InsufficientWeightError(amount, current?.currentWeight || 0);
  }

  const [record] = await WeightStockMovement.create(
    [
      {
        ...movement,
        type,
        direction,
        weight: amount,
        balanceBefore: roundWeight(stock.currentWeight - delta),
        balanceAfter: stock.currentWeight,
        createdBy,
      },
    ],
    { session: session || undefined, ordered: true },
  );

  return { stock, movement: record };
}

/** Sets storage to an exact weight (stocktaking) and logs the difference. */
export async function setWeightStock({
  weight,
  createdBy,
  notes,
  session,
}: {
  weight: number;
  createdBy?: string;
  notes?: string;
  session?: Session;
}) {
  const target = roundWeight(Number(weight || 0));
  if (target < 0) throw new Error("المخزون لا يمكن أن يكون أقل من صفر");

  await getWeightStock(session);
  const before = await WeightStock.findOneAndUpdate(
    { key: STOCK_KEY },
    { $set: { currentWeight: target, updatedBy: createdBy } },
    { new: false, session: session || undefined },
  );

  const previous = roundWeight(before?.currentWeight || 0);
  const difference = roundWeight(target - previous);
  const stock = await getWeightStock(session);

  if (Math.abs(difference) < EPSILON) return { stock, movement: null };

  const [record] = await WeightStockMovement.create(
    [
      {
        type: "adjust",
        direction: difference > 0 ? "in" : "out",
        weight: Math.abs(difference),
        balanceBefore: previous,
        balanceAfter: target,
        notes,
        createdBy,
      },
    ],
    { session: session || undefined, ordered: true },
  );

  return { stock, movement: record };
}

export async function assertWeightAvailable(
  required: number,
  session?: Session,
) {
  const amount = roundWeight(required);
  if (amount <= 0) return;
  const stock = await getWeightStock(session);
  if ((stock?.currentWeight || 0) + EPSILON < amount) {
    throw new InsufficientWeightError(amount, stock?.currentWeight || 0);
  }
}

/** Deducts a completed order's weight items from storage. */
export async function applyOrderWeightSale(
  order: any,
  createdBy: string,
  { session, allowNegative = false }: { session?: Session; allowNegative?: boolean } = {},
) {
  const weight = sumWeightItems(order?.weightItems);
  if (weight <= 0) return null;

  return moveWeightStock({
    type: "sale",
    weight,
    createdBy,
    session,
    allowNegative,
    movement: {
      relatedOrderId: order._id,
      price: Number(order.total || 0),
      notes: `بيع بالطلب رقم #${order._id}`,
    },
  });
}

/**
 * Returns to storage whatever is still deducted for this order.
 * Uses the movement ledger (not the order items), so orders completed before
 * stock tracking existed are never "returned" into storage.
 */
export async function revertOrderWeightSale(
  order: any,
  createdBy: string,
  reason: "adjustment" | "cancelled_order" = "adjustment",
  session?: Session,
) {
  if (!order?._id) return null;

  const [net] = await WeightStockMovement.aggregate([
    {
      $match: {
        relatedOrderId: Number(order._id),
        type: { $in: ["sale", "sale_return"] },
      },
    },
    {
      $group: {
        _id: null,
        weight: {
          $sum: {
            $cond: [{ $eq: ["$type", "sale"] }, "$weight", { $multiply: ["$weight", -1] }],
          },
        },
      },
    },
  ]).session(session || null);

  const outstanding = roundWeight(net?.weight || 0);
  if (outstanding <= EPSILON) return null;

  return moveWeightStock({
    type: "sale_return",
    weight: outstanding,
    createdBy,
    session,
    movement: {
      relatedOrderId: order._id,
      notes:
        reason === "cancelled_order"
          ? `إرجاع وزن الطلب الملغي رقم #${order._id}`
          : `إرجاع وزن الطلب رقم #${order._id} للتعديل`,
    },
  });
}

/** Aggregated storage figures for a date range (used by stock page, accounting and dashboard). */
export async function getWeightMovementStats(
  match: Record<string, unknown> = {},
) {
  const rows = await WeightStockMovement.aggregate([
    { $match: match },
    {
      $group: {
        _id: { type: "$type", status: "$status" },
        weight: { $sum: "$weight" },
        price: { $sum: { $ifNull: ["$price", 0] } },
        collected: {
          $sum: { $cond: [{ $eq: ["$isCollected", true] }, { $ifNull: ["$price", 0] }, 0] },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const pick = (type: string, status?: string) =>
    rows
      .filter((row) => row._id.type === type && (!status || row._id.status === status))
      .reduce(
        (acc, row) => ({
          weight: acc.weight + row.weight,
          price: acc.price + row.price,
          collected: acc.collected + row.collected,
          count: acc.count + row.count,
        }),
        { weight: 0, price: 0, collected: 0, count: 0 },
      );

  const sales = pick("sale");
  const returns = pick("sale_return");
  const transfers = pick("transfer", "completed");
  const added = pick("add");
  const deducted = pick("deduct");
  const adjustIn = rows
    .filter((row) => row._id.type === "adjust")
    .reduce((sum, row) => sum + row.weight, 0);

  return {
    soldKg: roundWeight(sales.weight - returns.weight),
    addedKg: roundWeight(added.weight),
    deductedKg: roundWeight(deducted.weight),
    adjustedKg: roundWeight(adjustIn),
    transferredKg: roundWeight(transfers.weight),
    transfersCount: transfers.count,
    transferValue: Math.round(transfers.price * 100) / 100,
    transferCollected: Math.round(transfers.collected * 100) / 100,
    movementsCount: rows.reduce((sum, row) => sum + row.count, 0),
  };
}

export async function logWeightActivity(
  {
    action,
    actionType,
    details,
    severity = "info",
    metadata,
    createdBy,
  }: {
    action: string;
    actionType: string;
    details: string;
    severity?: "info" | "success" | "warning" | "error";
    metadata?: Record<string, unknown>;
    createdBy: string;
  },
  session?: Session,
) {
  await Activity.create(
    [{ action, actionType, details, severity, metadata, createdBy }],
    { session: session || undefined, ordered: true },
  );
}
