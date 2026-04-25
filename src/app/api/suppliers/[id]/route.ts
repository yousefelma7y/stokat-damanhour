import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Supplier from "@/models/Supplier";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Transaction from "@/models/Transaction";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const id = parseInt((await params).id);

    if (isNaN(id)) {
      return errorResponse("معرف التاجر غير صحيح", 400);
    }

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return errorResponse("التاجر غير موجود", 404);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "25");

    const filter = {
      supplier: id,
      isActive: true,
    };

    const skip = (page - 1) * limit;
    const total = await Order.countDocuments(filter);

    // Fetch supplier orders (delayed orders)
    const ordersPromise = Order.find(filter)
      .populate("items.product", "name model size price")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    // Fetch supplier transactions
    const transactionsPromise = Transaction.find({
      relatedModel: "Supplier",
      relatedId: id,
    })
      .sort({ createdAt: -1 })
      .limit(50); // Limit to recent 50 for now

    const [orders, transactions] = await Promise.all([
      ordersPromise,
      transactionsPromise,
    ]);

    return successResponse(
      {
        supplier,
        orders,
        transactions,
      },
      "Supplier details retrieved",
      {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const id = parseInt((await params).id);
    const body = await request.json();

    if (isNaN(id)) {
      return errorResponse("معرف التاجر غير صحيح", 400);
    }

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return errorResponse("التاجر غير موجود", 404);
    }

    // Check availability of name/phone if changing
    if (body.name && body.name !== supplier.name) {
      const existingName = await Supplier.findOne({
        name: body.name,
        _id: { $ne: id },
      });
      if (existingName) {
        return errorResponse("اسم التاجر هذا مستخدم بالفعل", 400);
      }
      supplier.name = body.name;
    }

    if (body.phone && body.phone !== supplier.phone) {
      const existingPhone = await Supplier.findOne({
        phone: body.phone,
        _id: { $ne: id },
      });
      if (existingPhone) {
        return errorResponse("رقم الهاتف هذا مستخدم بالفعل", 400);
      }
      supplier.phone = body.phone;
    }

    if (body.note !== undefined) {
      supplier.note = body.note;
    }

    // Wallet is typically managed by transactions, but in case of manual override/correction via PUT we could allow it (be careful)
    // For now, let's stick to name/phone/note as requested by "change his name or number"

    await supplier.save();

    // Log activity
    try {
      const currentUser = await getCurrentUserName(request);
      await Activity.create({
        action: "تم تعديل بيانات مورد",
        actionType: "supplier_updated",
        createdBy: currentUser,
        severity: "info",
        details: `تم تحديث بيانات المورد "${supplier.name}"`,
        metadata: { supplierId: supplier._id, changes: body },
      });
    } catch (e) {
      console.error("Failed to log supplier update activity", e);
    }

    return successResponse(supplier, "تم تحديث بيانات التاجر بنجاح");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const id = parseInt((await params).id);

    if (isNaN(id)) {
      return errorResponse("معرف التاجر غير صحيح", 400);
    }

    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!supplier) {
      return errorResponse("التاجر غير موجود", 404);
    }

    // Log activity
    try {
      const currentUser = await getCurrentUserName(request);
      await Activity.create({
        action: "تم حذف مورد",
        actionType: "supplier_deleted",
        createdBy: currentUser,
        severity: "warning",
        details: `تم تعطيل المورد ${supplier.name} (${supplier._id})`,
        metadata: { supplierId: supplier._id },
      });
    } catch (e) {
      // ignore logging errors
      console.error("Failed to log supplier deletion activity", e);
    }

    return successResponse(supplier, "Supplier deleted");
  } catch (error) {
    return handleError(error);
  }
}
