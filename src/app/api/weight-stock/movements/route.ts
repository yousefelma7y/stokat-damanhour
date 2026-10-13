import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import WeightStockMovement from "@/models/WeightStockMovement";
import { getWeightMovementStats, getWeightStock } from "@/lib/weight-stock";
import { handleError, successResponse } from "@/lib/api-response";
import { applySeasonToFilter, resolveSeason } from "@/lib/seasons";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const filter: Record<string, any> = {};

    const type = searchParams.get("type");
    if (type) {
      // "sale" / "transfer" filters include their reversals so the list stays readable
      const groups: Record<string, string[]> = {
        sale: ["sale", "sale_return"],
        transfer: ["transfer", "transfer_cancel"],
        manual: ["add", "deduct", "adjust"],
      };
      filter.type = { $in: groups[type] || [type] };
    }

    const shop = searchParams.get("shop");
    if (shop && !Number.isNaN(Number(shop))) filter.shop = Number(shop);

    const status = searchParams.get("status");
    if (status) filter.status = status;

    const search = searchParams.get("search");
    if (search) {
      const or: Record<string, unknown>[] = [
        { notes: { $regex: search, $options: "i" } },
        { shopName: { $regex: search, $options: "i" } },
        { createdBy: { $regex: search, $options: "i" } },
      ];
      if (!Number.isNaN(Number(search))) {
        or.push({ _id: Number(search) }, { relatedOrderId: Number(search) });
      }
      filter.$or = or;
    }

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

    const seasonParam = searchParams.get("season");
    if (seasonParam) {
      const { season } = await resolveSeason(seasonParam);
      applySeasonToFilter(filter, season);
    }

    const skip = (page - 1) * limit;
    const [total, data, stats, stock] = await Promise.all([
      WeightStockMovement.countDocuments(filter),
      WeightStockMovement.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      getWeightMovementStats(filter),
      getWeightStock(),
    ]);

    return successResponse(data, "Weight stock movements retrieved", {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
      stats,
      stock,
    });
  } catch (error) {
    return handleError(error);
  }
}
