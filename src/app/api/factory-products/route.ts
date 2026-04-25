import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FactoryProduct from "@/models/FactoryProducts";
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

// GET - List all factory products with pagination and search
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const filter: any = {};

    const skip = (page - 1) * limit;

    if (search) {
      filter.productName = { $regex: search, $options: "i" };
    }

    const total = await FactoryProduct.countDocuments(filter);
    const data = await FactoryProduct.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return successResponse(data, "منتجات المصنع تم استرجاعها", {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

// POST - Create or update factory product stock
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { productName, stock } = body;

    // Validate input
    if (!productName || stock === undefined) {
      return errorResponse("اسم المنتج والكمية مطلوبة", 400);
    }

    // Validate productName
    if (!["بطارية جافة", "بطارية مية", "رصاص"].includes(productName)) {
      return errorResponse("المنتج يجب أن يكون 'بطارية جافة' أو 'بطارية مية' أو 'رصاص'", 400);
    }

    // Validate stock quantity is positive
    if (stock <= 0) {
      return errorResponse("الكمية يجب أن تكون أكبر من صفر", 400);
    }

    let factoryProduct = await FactoryProduct.findOne({
      productName: productName,
    });

    const isNewProduct = !factoryProduct;
    if (factoryProduct) {
      factoryProduct.stock += stock;
      await factoryProduct.save();
    } else {
      factoryProduct = await FactoryProduct.create({
        productName,
        stock,
      });
    }

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: isNewProduct ? "تم إضافة منتج مصنع" : "تم تحديث مخزون منتج مصنع",
      actionType: isNewProduct
        ? "factory_product_created"
        : "factory_product_updated",
      createdBy: currentUser,
      severity: "success",
      details: `تم ${isNewProduct ? "إضافة" : "تحديث"} منتج "${productName}" - الكمية: ${stock}`,
      metadata: { factoryProductId: factoryProduct._id, productName, stock },
    });

    return successResponse(factoryProduct, "تم إضافة المنتج بنجاح");
  } catch (error: any) {
    return handleError(error);
  }
}
