import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import WastedProduct from "@/models/WastedProduct";
import Product from "@/models/Product";
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

// GET - List all wasted products with pagination and search
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const filter: any = {};

    const skip = (page - 1) * limit;

    // Get wasted products with populated product details
    let query = WastedProduct.find(filter).populate(
      "product",
      "name model size price stock",
    );

    // Apply search if provided
    if (search) {
      // First, find products matching search
      const matchingProducts = await Product.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { model: { $regex: search, $options: "i" } },
          { barcode: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      const productIds = matchingProducts.map((p) => p._id);
      filter.product = { $in: productIds };

      query = WastedProduct.find(filter).populate(
        "product",
        "name model size price stock",
      );
    }

    const total = await WastedProduct.countDocuments(filter);

    const data = await query.skip(skip).limit(limit).sort({ createdAt: -1 });

    return successResponse(data, "منتجات متهالكة تم استرجاعها", {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST - Create or update wasted product
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { productId, stock, condition, reason } = body;

    // Validate input
    if (!productId || stock === undefined) {
      return errorResponse("معرف المنتج والكمية مطلوبة", 400);
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return errorResponse("المنتج غير موجود", 404);
    }

    // Validate stock quantity is positive
    if (stock <= 0) {
      return errorResponse("الكمية يجب أن تكون أكبر من صفر", 400);
    }

    if (product.stock < stock) {
      return errorResponse(
        `الكمية المتاحة من المنتج: ${product.stock}، الكمية المطلوبة: ${stock}`,
        400,
      );
    }

    let wastedProduct = await WastedProduct.findOne({
      product: productId,
    });

    const isNewWaste = !wastedProduct;
    if (wastedProduct) {
      wastedProduct.stock += stock;
      wastedProduct.reason = reason || wastedProduct.reason;
      await wastedProduct.save();
    } else {
      wastedProduct = await WastedProduct.create({
        product: productId,
        stock,
        condition: condition || "damaged",
        reason: reason || "عودة العميل",
      });
    }

    product.stock -= stock;
    await product.save();

    await wastedProduct.populate(
      "product",
      "name model size price stock",
    );

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم تسجيل منتج متهالك",
      actionType: "wasted_product_created",
      createdBy: currentUser,
      severity: "warning",
      details: `تم تسجيل ${stock} من "${product.name}" كمنتج متهالك - السبب: ${reason || "غير محدد"}`,
      metadata: {
        wastedProductId: wastedProduct._id,
        productId,
        stock,
        reason,
      },
    });

    return successResponse(wastedProduct, "منتج متهالك تم إضافته");
  } catch (error: any) {
    return handleError(error);
  }
}
