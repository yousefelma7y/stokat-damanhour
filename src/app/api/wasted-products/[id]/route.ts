// FILE LOCATION: app/api/wasted-products/[id]/route.ts

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

// GET - Get single wasted product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();

    const data = await WastedProduct.findById(id).populate(
      "product",
      "name model size price stock",
    );

    if (!data) {
      return errorResponse("Wasted product not found", 404);
    }

    return successResponse(data, "Wasted product retrieved");
  } catch (error) {
    return handleError(error);
  }
}

// PUT - Update wasted product (status, notes, etc)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();

    const body = await request.json();
    const { condition, reason, stock } = body;

    const wastedProduct = await WastedProduct.findById(id);
    if (!wastedProduct) {
      return errorResponse("Wasted product not found", 404);
    }

    // Update fields
    if (condition) wastedProduct.condition = condition;
    if (reason) wastedProduct.reason = reason;
    if (stock !== undefined) wastedProduct.stock = stock;

    await wastedProduct.save();
    await wastedProduct.populate("product", "name model size price");

    return successResponse(wastedProduct, "Wasted product updated");
  } catch (error) {
    return handleError(error);
  }
}

// DELETE - Soft delete wasted product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();

    const wastedProduct = await WastedProduct.findById(id);
    if (!wastedProduct) {
      return errorResponse("Wasted product not found", 404);
    }

    // Populate product reference
    await wastedProduct.populate("product", "name stock");

    const product = await Product.findById(wastedProduct.product);

    const returnedQty = wastedProduct.stock || 0;

    // If associated product exists, restore its stock
    if (product && returnedQty > 0) {
      product.stock = (product.stock || 0) + returnedQty;
      await product.save();
    }

    // Move all wasted stock to returnedQuantity and zero the wasted stock
    wastedProduct.returnedQuantity =
      (wastedProduct.returnedQuantity || 0) + returnedQty;
    wastedProduct.stock = 0;
    wastedProduct.isActive = false; // mark as deleted
    await wastedProduct.save();

    try {
      const currentUser = await getCurrentUserName(request);
      await Activity.create({
        action: "تم حذف منتج متالف",
        actionType: "wasted_product_deleted",
        createdBy: currentUser,
        severity: "error",
        details: `تم حذف سجل المنتج المتالف "${product?.name || "غير معروف"}" وإرجاع ${returnedQty} إلى المخزون`,
        metadata: {
          wastedProductId: wastedProduct._id,
          productId: wastedProduct.product,
          returnedQty,
        },
      });
    } catch (logError) {
      console.error("Failed to log wasted product deletion activity:", logError);
    }

    return successResponse(
      wastedProduct,
      "Wasted product deleted and stock restored",
    );
  } catch (error) {
    return handleError(error);
  }
}
