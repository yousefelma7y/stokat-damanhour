import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/get-current-user";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import PaymentMethod from "@/models/PaymentMethod";
import Product from "@/models/Product";
import Season from "@/models/Season";
import Shop from "@/models/Shop";
import Transaction from "@/models/Transaction";
import WeightProduct from "@/models/WeightProduct";
import WeightStockMovement from "@/models/WeightStockMovement";
import { getSeasonSummary, seasonCreatedAt } from "@/lib/seasons";
import { errorResponse, handleError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Downloads a full backup of one season as a JSON file.
 * The body is streamed straight from database cursors so large seasons
 * don't have to fit in memory (or in a single serverless response).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const user = await getCurrentUser(request);
    if (user?.role !== "admin") return errorResponse("غير مصرح", 403);

    const season = await Season.findById(Number(id));
    if (!season) return errorResponse("الموسم غير موجود", 404);

    const createdAt = seasonCreatedAt(season);
    const summary = await getSeasonSummary(season);
    const encoder = new TextEncoder();

    // [json key, query]: season records first, then reference lists needed to read them.
    const sections: [string, any][] = [
      ["transactions", Transaction.find({ createdAt }).sort({ createdAt: 1 })],
      ["orders", Order.find({ createdAt }).sort({ createdAt: 1 })],
      ["weightMovements", WeightStockMovement.find({ createdAt }).sort({ createdAt: 1 })],
      ["customers", Customer.find({}).select("-completedOrders")],
      ["products", Product.find({})],
      ["weightProducts", WeightProduct.find({})],
      ["paymentMethods", PaymentMethod.find({})],
      ["shops", Shop.find({})],
    ];

    const stream = new ReadableStream({
      async start(controller) {
        const write = (text: string) => controller.enqueue(encoder.encode(text));
        try {
          write(
            `{"format":"stokat-season-backup","version":1,"exportedAt":${JSON.stringify(new Date())},"exportedBy":${JSON.stringify(user.userName)},` +
              `"season":${JSON.stringify(season.toObject())},"summary":${JSON.stringify(summary)}`,
          );

          for (const [key, query] of sections) {
            write(`,"${key}":[`);
            let first = true;
            for await (const doc of query.lean().cursor()) {
              write((first ? "" : ",") + JSON.stringify(doc));
              first = false;
            }
            write("]");
          }

          write("}");
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    const stamp = new Date(season.endDate || Date.now()).toISOString().slice(0, 10);
    return new Response(stream, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="season-${season._id}-backup-${stamp}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
