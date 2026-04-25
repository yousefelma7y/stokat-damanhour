import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import FactoryProduct from "@/models/FactoryProducts";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

// GET - Get single factory product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();

    const data = await FactoryProduct.findById(id);

    if (!data) {
      return errorResponse("المنتج غير موجود", 404);
    }

    return successResponse(data, "تم استرجاع المنتج");
  } catch (error) {
    return handleError(error);
  }
}

// PUT - Update factory product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();

    const body = await request.json();
    const { productName, stock, returnedQuantity } = body;

    const factoryProduct = await FactoryProduct.findById(id);
    if (!factoryProduct) {
      return errorResponse("المنتج غير موجود", 404);
    }

    // Update fields
    if (productName) {
      if (!["بطارية جافة", "بطارية مية", "رصاص"].includes(productName)) {
        return errorResponse("المنتج يجب أن يكون 'بطارية جافة' أو 'بطارية مية' أو 'رصاص'", 400);
      }
      factoryProduct.productName = productName as any;
    }
    if (stock !== undefined) factoryProduct.stock = stock;
    if (returnedQuantity !== undefined) {
      if (typeof returnedQuantity !== "number" || returnedQuantity < 0) {
        return errorResponse("الكمية المرتجعة يجب أن تكون رقمًا صحيحًا أكبر من أو يساوي صفر", 400);
      }
      factoryProduct.returnedQuantity = returnedQuantity;
      if (returnedQuantity === 0) {
        factoryProduct.returnDate = undefined;
      } else if (!factoryProduct.returnDate) {
        factoryProduct.returnDate = new Date();
      }
    }

    await factoryProduct.save();

    return successResponse(factoryProduct, "تم تحديث المنتج بنجاح");
  } catch (error) {
    return handleError(error);
  }
}

// DELETE - Delete factory product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();

    const data = await FactoryProduct.findByIdAndDelete(id);

    if (!data) {
      return errorResponse("المنتج غير موجود", 404);
    }

    return successResponse(data, "تم حذف المنتج بنجاح");
  } catch (error) {
    return handleError(error);
  }
}
