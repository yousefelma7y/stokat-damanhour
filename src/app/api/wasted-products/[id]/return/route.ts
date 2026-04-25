// FILE LOCATION: app/api/wasted-products/[id]/return/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import WastedProduct from "@/models/WastedProduct";
import Product from "@/models/Product";
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";
import { errorResponse } from "@/lib/api-response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();

    const body = await request.json();
    const { quantityToReturn } = body;

    // Validate input
    if (!quantityToReturn || quantityToReturn <= 0) {
      return errorResponse("كمية صحيحة مطلوبة", 400);
    }

    // Get wasted product with populated product details
    const wastedProduct = await WastedProduct.findById(id).populate(
      "product",
      "name stock _id",
    );

    if (!wastedProduct) {
      return errorResponse("المنتج المتهالك غير موجود", 404);
    }

    // Validate return quantity
    if (wastedProduct.stock < quantityToReturn) {
      return errorResponse(
        `الكمية المتاحة: ${wastedProduct.stock}، الكمية المطلوبة: ${quantityToReturn}`,
        400,
      );
    }

    // Get the original product
    const product = await Product.findById(wastedProduct.product);

    if (!product) {
      return errorResponse("المنتج الأصلي غير موجود", 404);
    }

    // ✅ Update wasted product stock
    wastedProduct.stock -= quantityToReturn;
    wastedProduct.returnedQuantity =
      (wastedProduct.returnedQuantity || 0) + quantityToReturn;
    wastedProduct.returnDate = new Date();
    await wastedProduct.save();

    // ✅ ADD to main product stock (increase it)
    product.stock += quantityToReturn;
    await product.save();

    try {
      const currentUser = await getCurrentUserName(request);
      await Activity.create({
        action: "تم إرجاع منتج متالف للمخزون",
        actionType: "wasted_product_returned",
        createdBy: currentUser,
        severity: "info",
        details: `تم إرجاع ${quantityToReturn} من "${product.name}" إلى المخزون. المتبقي في المتالف: ${wastedProduct.stock}`,
        metadata: {
          wastedProductId: wastedProduct._id,
          productId: product._id,
          quantityReturned: quantityToReturn,
          remainingWastedStock: wastedProduct.stock,
          newProductStock: product.stock,
        },
      });
    } catch (logError) {
      console.error("Failed to log wasted product return activity:", logError);
    }

    // Prepare response
    const responseData = {
      success: true,
      message: `تم إرجاع ${quantityToReturn} من المنتج بنجاح`,
      data: {
        wastedProduct: {
          _id: wastedProduct._id,
          productName: product.name,
          remainingStock: wastedProduct.stock,
          totalReturned: wastedProduct.returnedQuantity,
        },
        product: {
          _id: product._id,
          name: product.name,
          newStock: product.stock,
        },
        transaction: {
          quantityReturned: quantityToReturn,
          timestamp: new Date(),
        },
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error("Return error:", error);
    return errorResponse("خطأ في عملية الإرجاع", 500);
  }
}
