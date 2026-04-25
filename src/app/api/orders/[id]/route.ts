import { NextRequest } from "next/server";
import Account from "@/models/Account";
import Activity from "@/models/Activity";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Transaction from "@/models/Transaction";
import WeightProduct from "@/models/WeightProduct";
import { connectDB } from "@/lib/mongodb";
import { withRetry, withTimeout } from "@/lib/retry-helper";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  errorResponse,
  handleError,
  successResponse,
} from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

function populateOrder(query: any) {
  return query
    .populate("customer", "name phone location")
    .populate("items.product", "name model size price stock")
    .populate("weightItems.weightProduct", "name pricePerKg");
}

async function revertOrderEffects(order: any, currentUser: string) {
  if (!order || order.status !== "completed") return;

  if (order.customer) {
    await Customer.findByIdAndUpdate(order.customer, {
      $pull: { completedOrders: order._id },
      $inc: { totalPayments: -order.total },
    });
  }

  for (const item of order.items || []) {
    const productId = (item.product as any)._id || item.product;
    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: item.quantity || 0 },
    });
  }

  const systemAccount = await Account.findOne({ accountType: "system" });
  if (systemAccount) {
    systemAccount.currentBalance -= order.total || 0;
    systemAccount.totalDebits += order.total || 0;
    await systemAccount.save();
  }

  await Transaction.create({
    transactionId: `TXN-ORD-REV-${order._id}-${Date.now()}`,
    type: "payment",
    category: "adjustment",
    isExpense: true,
    from: "system",
    to: "None",
    amount: order.total || 0,
    gain: 0,
    balanceAfter: systemAccount?.currentBalance || 0,
    description: `إلغاء الطلب رقم ${order._id}`,
    status: "completed",
    relatedModel: "Order",
    relatedId: order._id,
    paymentMethod: "cash",
    createdBy: currentUser,
  });
}

async function applyOrderEffects(order: any, currentUser: string) {
  if (!order || order.status !== "completed") return;

  let totalGain = 0;

  if (order.customer) {
    await Customer.findByIdAndUpdate(order.customer, {
      $push: { completedOrders: order._id },
      $inc: { totalPayments: order.total },
    });
  }

  for (const item of order.items || []) {
    const productId = (item.product as any)._id || item.product;
    const productDoc = await Product.findById(productId);
    await Product.findByIdAndUpdate(productId, {
      $inc: { stock: -(item.quantity || 0) },
    });

    if (productDoc) {
      totalGain += item.total || (item.price || 0) * (item.quantity || 0);
    }
  }

  for (const item of order.weightItems || []) {
    totalGain += item.total || 0;
  }

  let systemAccount = await Account.findOne({ accountType: "system" });
  if (!systemAccount) {
    systemAccount = await Account.create({
      accountType: "system",
      entityName: "نظام ستوكات دمنهور",
      currentBalance: 0,
    });
  }

  systemAccount.currentBalance += order.total || 0;
  systemAccount.totalCredits += order.total || 0;
  await systemAccount.save();

  await Transaction.create({
    transactionId: `TXN-ORD-FIX-${order._id}-${Date.now()}`,
    type: "income",
    category: "sales",
    from: `طلب رقم ${order._id}`,
    to: "system",
    amount: order.total || 0,
    gain: totalGain,
    balanceAfter: systemAccount.currentBalance,
    description: `تطبيق الطلب رقم ${order._id} (cash)`,
    status: "completed",
    relatedModel: "Order",
    relatedId: order._id,
    paymentMethod: "cash",
    createdBy: currentUser,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();

    const data = await withTimeout(
      withRetry(() => populateOrder(Order.findById(id).lean()), {
        retries: 2,
        delay: 500,
      }),
      8000,
      "Order fetch timed out",
    );

    if (!data) return errorResponse("Order not found", 404);
    return successResponse(data, "Order retrieved");
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    await connectDB();
    const body = await request.json();
    const currentUser = await getCurrentUserName(request);

    const oldOrder = await populateOrder(Order.findById(id));
    if (!oldOrder) return errorResponse("Order not found", 404);

    await revertOrderEffects(oldOrder, currentUser);

    if (body.customer && typeof body.customer === "object") {
      const existingCustomer = await Customer.findOne({
        phone: body.customer.phone,
        isActive: true,
      });

      if (existingCustomer) {
        existingCustomer.name = body.customer.name;
        existingCustomer.location = body.customer.location || "";
        await existingCustomer.save();
        body.customer = existingCustomer._id;
      }
    }

    const items = (body.items || []).map((item: any) => ({
      ...item,
      quantity: Number(item.quantity || 0),
      price: Number(item.price || 0),
      total: Number(item.quantity || 0) * Number(item.price || 0),
    }));

    const weightItems = (body.weightItems || []).map((item: any) => ({
      ...item,
      weight: Number(item.weight || 0),
      pricePerKg: Number(item.pricePerKg || 0),
      total: Number(item.weight || 0) * Number(item.pricePerKg || 0),
    }));

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.stock < item.quantity) {
        await applyOrderEffects(oldOrder, currentUser);
        return errorResponse(`لا يوجد مخزون كافٍ للمنتج "${product?.name || item.product}"`, 400);
      }
    }

    const subtotal =
      items.reduce(
        (sum: number, item: any) => sum + Number(item.total || 0),
        0,
      ) +
      weightItems.reduce(
        (sum: number, item: any) => sum + Number(item.total || 0),
        0,
      );

    const discountType = body.discount?.type || "fixed";
    const discountValue = Number(body.discount?.value || 0);
    const discountAmount =
      discountType === "percentage"
        ? (subtotal * discountValue) / 100
        : discountValue;
    const shipping = Number(body.shipping || 0);
    const priceDiff = Number(body.priceDiff || 0);

    const updateBody = {
      ...body,
      items,
      weightItems,
      paymentMethod: "cash",
      subtotal,
      shipping,
      priceDiff,
      discount: {
        type: discountType,
        value: discountValue,
        amount: discountAmount,
      },
      total: subtotal - discountAmount + shipping + priceDiff,
    };

    const updatedOrder = await Order.findByIdAndUpdate(id, updateBody, {
      new: true,
    });
    if (!updatedOrder) return errorResponse("Failed to update order", 500);

    const finalOrder = await populateOrder(Order.findById(id));
    await applyOrderEffects(finalOrder, currentUser);

    await Activity.create({
      action: "تم تعديل طلب",
      actionType: "order_updated",
      createdBy: currentUser,
      severity: "warning",
      details: `تم تعديل الطلب رقم ${finalOrder._id}`,
      metadata: { orderId: finalOrder._id, changes: updateBody },
    });

    return successResponse(finalOrder, "Order updated successfully");
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const order = await Order.findById(id).populate("customer");
    if (!order) return errorResponse("Order not found", 404);

    const data = await Order.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    const currentUser = await getCurrentUserName(request);
    await Activity.create({
      action: "تم حذف طلب",
      actionType: "order_deleted",
      createdBy: currentUser,
      severity: "error",
      details: `تم حذف الطلب رقم ${order._id}`,
      metadata: { orderId: order._id },
    });

    return successResponse(data, "Order deleted");
  } catch (error) {
    return handleError(error);
  }
}
