import { NextRequest } from "next/server";
import { endOfDay, startOfDay, startOfMonth } from "date-fns";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/get-current-user";
import WeightStock from "@/models/WeightStock";
import WeightStockMovement from "@/models/WeightStockMovement";
import {
  formatKg,
  getWeightMovementStats,
  getWeightStock,
  logWeightActivity,
  moveWeightStock,
  roundWeight,
  setWeightStock,
} from "@/lib/weight-stock";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/api-response";
import { getCurrentSeason } from "@/lib/seasons";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    const now = new Date();
    // Sales figures restart with the season, so never count back past its start.
    const seasonStart = new Date((await getCurrentSeason()).startDate);
    const from = (date: Date) => (date > seasonStart ? date : seasonStart);

    const [stock, today, month, recentMovements] = await Promise.all([
      getWeightStock(),
      getWeightMovementStats({
        createdAt: { $gte: from(startOfDay(now)), $lte: endOfDay(now) },
      }),
      getWeightMovementStats({
        createdAt: { $gte: from(startOfMonth(now)), $lte: endOfDay(now) },
      }),
      WeightStockMovement.find({})
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    return successResponse(
      {
        stock,
        isLow:
          Number(stock?.currentWeight || 0) <=
          Number(stock?.lowStockThreshold || 0),
        today,
        month,
        recentMovements,
      },
      "Weight stock retrieved",
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Edit storage.
 * body: { mode: "add" | "deduct" | "set", weight, notes?, lowStockThreshold? }
 */
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (user?.role !== "admin") {
      return errorResponse("غير مصرح لك بتعديل مخزون الوزن", 403);
    }

    const body = await request.json();
    const createdBy = user.userName || "النظام";
    const mode = body.mode;
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";
    const hasWeight = body.weight !== undefined && body.weight !== "";
    const weight = roundWeight(Number(body.weight));

    if (body.lowStockThreshold !== undefined && body.lowStockThreshold !== "") {
      const threshold = Number(body.lowStockThreshold);
      if (!Number.isFinite(threshold) || threshold < 0) {
        return errorResponse("حد التنبيه يجب أن يكون رقم موجب", 400);
      }
      await getWeightStock();
      await WeightStock.updateOne(
        { key: "main" },
        { $set: { lowStockThreshold: roundWeight(threshold), updatedBy: createdBy } },
      );
    }

    let movement = null;
    if (hasWeight) {
      if (!Number.isFinite(weight) || weight < 0) {
        return errorResponse("أدخل وزن صحيح", 400);
      }

      if (mode === "set") {
        ({ movement } = await setWeightStock({ weight, createdBy, notes }));
      } else if (mode === "add" || mode === "deduct") {
        if (weight <= 0) return errorResponse("الوزن يجب أن يكون أكبر من صفر", 400);
        ({ movement } = await moveWeightStock({
          type: mode,
          weight,
          createdBy,
          movement: { notes },
        }));
      } else {
        return errorResponse("نوع التعديل غير صالح", 400);
      }
    }

    const stock = await getWeightStock();

    if (movement) {
      const labels: Record<string, string> = {
        add: "إضافة وارد لمخزون الوزن",
        deduct: "خصم من مخزون الوزن",
        adjust: "ضبط رصيد مخزون الوزن",
      };
      await logWeightActivity({
        action: labels[movement.type] || "تعديل مخزون الوزن",
        actionType: `weight_stock_${movement.type}`,
        severity: movement.direction === "in" ? "success" : "warning",
        details: `${labels[movement.type]}: ${movement.direction === "in" ? "+" : "-"}${formatKg(movement.weight)} — الرصيد الحالي ${formatKg(stock?.currentWeight || 0)}`,
        metadata: { movementId: movement._id, weight: movement.weight, notes },
        createdBy,
      });
    }

    return successResponse({ stock, movement }, "تم تحديث مخزون الوزن");
  } catch (error: any) {
    if (error?.name === "InsufficientWeightError") {
      return errorResponse(error.message, 400);
    }
    return handleError(error);
  }
}
