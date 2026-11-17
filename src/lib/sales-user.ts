import User from "@/models/User";

export class SalesUserError extends Error {
  status = 400;
  constructor(message: string) {
    super(message);
    this.name = "SalesUserError";
  }
}

export interface ResolvedSalesUser {
  salesUser?: number;
  salesUserName?: string;
}

/**
 * Resolves the user credited with a sale.
 * - If `salesUserId` is given it must be an existing, active user.
 * - Otherwise falls back to the logged-in user (if any).
 */
export async function resolveSalesUser(
  salesUserId: unknown,
  fallback?: { userId?: number; userName?: string } | null,
  session?: any,
): Promise<ResolvedSalesUser> {
  const hasId =
    salesUserId !== undefined && salesUserId !== null && salesUserId !== "";
  const id = hasId ? Number(salesUserId) : Number(fallback?.userId);

  if (!id || Number.isNaN(id)) return {};

  const query = User.findOne({ _id: id, isActive: true }).select(
    "_id userName",
  );
  if (session) query.session(session);
  const user = await query.lean();

  if (!user) {
    if (hasId) throw new SalesUserError("البائع المختار غير موجود أو تم حذفه");
    // Fallback user missing (e.g. system) – just don't assign
    return {};
  }

  return { salesUser: user._id, salesUserName: user.userName };
}

/**
 * Mongo condition matching orders credited to a user.
 * Older orders (before salesUser existed) fall back to `createdBy`.
 */
export async function buildSalesUserCondition(salesUserId: string) {
  const id = Number(salesUserId);
  if (!id || Number.isNaN(id)) return null;

  const user = await User.findById(id).select("userName").lean();
  const conditions: any[] = [{ salesUser: id }];
  if (user?.userName) {
    conditions.push({
      salesUser: null, // matches missing or null

      createdBy: user.userName,
    });
  }
  return { $or: conditions };
}
