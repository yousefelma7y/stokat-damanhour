import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FactoryProduct from "@/models/FactoryProducts";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

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

    // Get factory product
    const factoryProduct = await FactoryProduct.findById(id);

    if (!factoryProduct) {
      return errorResponse("المنتج غير موجود", 404);
    }

    // Validate return quantity
    if (factoryProduct.stock < quantityToReturn) {
      return errorResponse(
        `الكمية المتاحة: ${factoryProduct.stock}، الكمية المطلوبة: ${quantityToReturn}`,
        400,
      );
    }

    // ✅ Update factory product stock
    factoryProduct.stock -= quantityToReturn;
    factoryProduct.returnedQuantity =
      (factoryProduct.returnedQuantity || 0) + quantityToReturn;
    factoryProduct.returnDate = new Date();
    await factoryProduct.save();

    // Prepare response
    const responseData = {
      success: true,
      message: `تم إرجاع ${quantityToReturn} من المنتج بنجاح`,
      data: {
        _id: factoryProduct._id,
        productName: factoryProduct.productName,
        remainingStock: factoryProduct.stock,
        totalReturned: factoryProduct.returnedQuantity,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error("Return error:", error);
    return errorResponse("خطأ في عملية الإرجاع", 500);
  }
}
