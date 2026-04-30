import { NextRequest } from "next/server";
import Account from "@/models/Account";
import Activity from "@/models/Activity";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import PaymentMethod from "@/models/PaymentMethod";
import Product from "@/models/Product";
import Transaction from "@/models/Transaction";
import WeightProduct from "@/models/WeightProduct";
import { connectDB } from "@/lib/mongodb";
import { normalizeOrderPayments, roundMoney } from "@/lib/order-payments";
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

function hasBodyField(body: any, field: string) {
  return Object.prototype.hasOwnProperty.call(body, field);
}

function getRefId(value: any) {
  if (value && typeof value === "object") {
    return value._id ?? value.id ?? value;
  }

  return value;
}

function normalizeProductItems(items: any[] = []) {
  return items.map((item: any) => {
    const product = getRefId(item.product);
    const quantity = Number(item.quantity || 0);
    const price = Number(item.price || 0);

    return {
      product: Number(product),
      size: item.size || "",
      quantity,
      price,
      total: quantity * price,
    };
  });
}

function normalizeWeightItems(items: any[] = []) {
  return items.map((item: any) => {
    const weightProduct = getRefId(item.weightProduct);
    const weight = Number(item.weight || 0);
    const pricePerKg = Number(item.pricePerKg || 0);

    return {
      weightProduct: Number(weightProduct),
      weight,
      pricePerKg,
      total: weight * pricePerKg,
    };
  });
}

function getCheckoutPayments(order: any) {
  if (order?.payments?.length > 0) return order.payments;
  const paidAmount = Number(order?.paidAmount || 0);
  const remainingAmount = Number(order?.remainingAmount || 0);
  const settledDebtAmount = sumPayments(getDebtSettlementPayments(order));
  const fallbackPaidAmount =
    paidAmount > 0
      ? Math.max(0, roundMoney(paidAmount - settledDebtAmount))
      : remainingAmount > 0
        ? 0
        : Number(order?.total || 0);

  if (fallbackPaidAmount > 0) {
    return [
      {
        paymentMethodId: getRefId(order.paymentMethodId) || null,
        name: order.paymentMethod || "cash",
        amount: fallbackPaidAmount,
      },
    ];
  }

  return [];
}

function getDebtSettlementPayments(order: any) {
  return (order?.debtSettlements || [])
    .map((settlement: any, index: number) => ({
      index,
      paymentMethodId: getRefId(settlement.paymentMethodId) || null,
      name: settlement.paymentMethod || "debt settlement",
      amount: roundMoney(Number(settlement.amount || 0)),
      transactionId: settlement.transactionId,
      createdAt: settlement.createdAt,
    }))
    .filter((settlement: any) => settlement.amount > 0);
}

function sumPayments(payments: any[] = []) {
  return roundMoney(
    payments.reduce(
      (sum: number, payment: any) => sum + Number(payment.amount || 0),
      0,
    ),
  );
}

async function revertOrderEffects(
  order: any,
  currentUser: string,
  reason: "adjustment" | "cancelled_order" = "adjustment",
) {
  if (!order || order.status !== "completed") return;

  const checkoutPayments = getCheckoutPayments(order);
  const paidAtCheckout = sumPayments(checkoutPayments);
  const isCancelledOrder = reason === "cancelled_order";
  const settlementRefunds = isCancelledOrder
    ? getDebtSettlementPayments(order)
    : [];
  const settledDebtAmount = sumPayments(settlementRefunds);
  const totalCustomerRefund = roundMoney(paidAtCheckout + settledDebtAmount);
  const remainingAmount = roundMoney(Number(order.remainingAmount || 0));
  const debtAmount = roundMoney(Number(order.debtAmount || 0));

  const customerId =
    order.customer?._id ?? order.customer?.id ?? order.customer;
  const customerName = order.customer?.name
    ? `Customer: ${order.customer.name}`
    : customerId
      ? `Customer #${customerId}`
      : "Customer";

  if (customerId) {
    await Customer.findByIdAndUpdate(customerId, {
      $pull: { completedOrders: order._id },
      $inc: {
        totalPayments: -totalCustomerRefund,
        debtBalance: -remainingAmount,
        totalDebt: -debtAmount,
        totalDebtPaid: -settledDebtAmount,
      },
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
    systemAccount.currentBalance = roundMoney(
      Number(systemAccount.currentBalance || 0) - totalCustomerRefund,
    );
    systemAccount.totalDebits = roundMoney(
      Number(systemAccount.totalDebits || 0) + totalCustomerRefund,
    );
    await systemAccount.save();
  }

  for (const payment of checkoutPayments) {
    if (payment.paymentMethodId && Number(payment.amount || 0) > 0) {
      await PaymentMethod.findByIdAndUpdate(payment.paymentMethodId, {
        $inc: { balance: -Number(payment.amount || 0) },
      });
    }
  }

  for (const settlement of settlementRefunds) {
    if (settlement.paymentMethodId && settlement.amount > 0) {
      await PaymentMethod.findByIdAndUpdate(settlement.paymentMethodId, {
        $inc: { balance: -settlement.amount },
      });
    }
  }

  if (paidAtCheckout > 0) {
    await Transaction.create({
      transactionId: `${isCancelledOrder ? "TXN-ORD-CNL" : "TXN-ORD-REV"}-${order._id}-${Date.now()}`,
      type: "payment",
      category: isCancelledOrder ? "cancelled_order" : "adjustment",
      isExpense: true,
      from: "system",
      to: isCancelledOrder ? `طلب رقم ${order._id}` : "None",
      amount: paidAtCheckout,
      gain: 0,
      balanceAfter: systemAccount?.currentBalance || 0,
      description: isCancelledOrder
        ? `إلغاء الطلب رقم ${order._id}`
        : `عكس تأثير الطلب رقم ${order._id}`,
      status: isCancelledOrder ? "cancelled" : "completed",
      relatedModel: "Order",
      relatedId: order._id,
      paymentMethod: order.paymentMethod || "cash",
      paymentMethodId: getRefId(order.paymentMethodId) || null,
      createdBy: currentUser,
    });
  }

  if (settlementRefunds.length > 0) {
    await Transaction.create(
      settlementRefunds.map((settlement: any) => ({
        transactionId: `TXN-DEBT-REF-${order._id}-${settlement.index}-${Date.now()}`,
        type: "payment",
        category: "debt_settlement_refund",
        isExpense: true,
        from: "system",
        to: customerName,
        amount: settlement.amount,
        gain: 0,
        balanceAfter: systemAccount?.currentBalance || 0,
        description: `رد تسوية مديونية بسبب إلغاء الطلب رقم ${order._id}`,
        status: "cancelled",
        relatedModel: "Order",
        relatedId: order._id,
        paymentMethod: settlement.name,
        paymentMethodId: settlement.paymentMethodId,
        createdBy: currentUser,
      })),
    );
  }
}

async function applyOrderEffects(order: any, currentUser: string) {
  if (!order || order.status !== "completed") return;

  let totalGain = 0;
  const checkoutPayments = getCheckoutPayments(order);
  const paidAtCheckout = sumPayments(checkoutPayments);
  const remainingAmount = roundMoney(Number(order.remainingAmount || 0));
  const debtAmount = roundMoney(Number(order.debtAmount || 0));

  const customerId =
    order.customer?._id ?? order.customer?.id ?? order.customer;

  if (customerId) {
    await Customer.findByIdAndUpdate(customerId, {
      $push: { completedOrders: order._id },
      $inc: {
        totalPayments: paidAtCheckout,
        debtBalance: remainingAmount,
        totalDebt: debtAmount,
      },
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

  systemAccount.currentBalance += paidAtCheckout;
  systemAccount.totalCredits += paidAtCheckout;
  await systemAccount.save();

  for (const payment of checkoutPayments) {
    if (payment.paymentMethodId && Number(payment.amount || 0) > 0) {
      await PaymentMethod.findByIdAndUpdate(payment.paymentMethodId, {
        $inc: { balance: Number(payment.amount || 0) },
      });
    }
  }

  if (paidAtCheckout > 0) {
    await Transaction.create(
      checkoutPayments
        .filter((payment: any) => Number(payment.amount || 0) > 0)
        .map((payment: any) => ({
          transactionId: `TXN-ORD-FIX-${order._id}-${payment.paymentMethodId}-${Date.now()}`,
          type: "income",
          category: "sales",
          from: `طلب رقم ${order._id}`,
          to: "system",
          amount: Number(payment.amount || 0),
          gain: roundMoney(
            (totalGain * Number(payment.amount || 0)) / paidAtCheckout,
          ),
          balanceAfter: systemAccount.currentBalance,
          description: `تطبيق الطلب رقم ${order._id} (${payment.name || order.paymentMethod || "cash"})`,
          status: "completed",
          relatedModel: "Order",
          relatedId: order._id,
          paymentMethod: payment.name || order.paymentMethod || "cash",
          paymentMethodId: payment.paymentMethodId || null,
          createdBy: currentUser,
        })),
    );
  }
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

    const nextStatus = body.status || oldOrder.status || "pending";
    await revertOrderEffects(
      oldOrder,
      currentUser,
      nextStatus === "cancelled" ? "cancelled_order" : "adjustment",
    );

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

    const rawItems = hasBodyField(body, "items")
      ? body.items || []
      : oldOrder.items || [];
    const rawWeightItems = hasBodyField(body, "weightItems")
      ? body.weightItems || []
      : oldOrder.weightItems || [];
    const items = normalizeProductItems(rawItems);
    const weightItems = normalizeWeightItems(rawWeightItems);
    const nextOrderType =
      body.order_type ||
      oldOrder.order_type ||
      (weightItems.length > 0 ? "weight" : "regular");

    if (nextStatus !== "cancelled") {
      if (nextOrderType === "regular" && items.length === 0) {
        await applyOrderEffects(oldOrder, currentUser);
        return errorResponse("طلب المنتجات يجب أن يحتوي على منتج واحد على الأقل", 400);
      }

      if (nextOrderType === "weight" && weightItems.length === 0) {
        await applyOrderEffects(oldOrder, currentUser);
        return errorResponse("طلب الوزن يجب أن يحتوي على صنف وزن واحد على الأقل", 400);
      }
    }

    if (nextStatus === "completed") {
      for (const item of items) {
        const product = await Product.findById(item.product);
        if (!product || product.stock < item.quantity) {
          await applyOrderEffects(oldOrder, currentUser);
          return errorResponse(`لا يوجد مخزون كافٍ للمنتج "${product?.name || item.product}"`, 400);
        }
      }

      for (const item of weightItems) {
        const weightProduct = await WeightProduct.findById(item.weightProduct);
        if (!weightProduct) {
          await applyOrderEffects(oldOrder, currentUser);
          return errorResponse(`صنف الوزن غير موجود "${item.weightProduct}"`, 400);
        }
      }
    }

    const subtotal = roundMoney(
      items.reduce(
        (sum: number, item: any) => sum + Number(item.total || 0),
        0,
      ) +
        weightItems.reduce(
          (sum: number, item: any) => sum + Number(item.total || 0),
          0,
        ),
    );

    const previousDiscount = oldOrder.discount || {};
    const discountType = body.discount?.type ?? previousDiscount.type ?? "fixed";
    const discountValue = Number(body.discount?.value ?? previousDiscount.value ?? 0);
    const discountAmount =
      discountType === "percentage"
        ? Math.min(subtotal, roundMoney((subtotal * discountValue) / 100))
        : Math.min(subtotal, roundMoney(discountValue));
    const shipping = roundMoney(Number(body.shipping ?? oldOrder.shipping ?? 0));
    const priceDiff = roundMoney(Number(body.priceDiff ?? oldOrder.priceDiff ?? 0));
    const nextTotal = roundMoney(
      Math.max(0, subtotal - discountAmount + shipping + priceDiff),
    );

    const paymentInputChanged =
      hasBodyField(body, "payments") ||
      hasBodyField(body, "paymentMethodId") ||
      hasBodyField(body, "paidAmount") ||
      hasBodyField(body, "isDebt");
    const fallbackPaymentMethodId = body.paymentMethodId
      ? Number(body.paymentMethodId)
      : getRefId(oldOrder.paymentMethodId) || null;
    const fallbackPaidAmount = hasBodyField(body, "paidAmount")
      ? Number(body.paidAmount || 0)
      : nextTotal;
    const paymentSource = hasBodyField(body, "payments")
      ? body.payments
      : paymentInputChanged && fallbackPaymentMethodId
        ? [{ paymentMethodId: fallbackPaymentMethodId, amount: fallbackPaidAmount }]
        : oldOrder.payments || [];

    let paymentInfo;
    try {
      paymentInfo = await normalizeOrderPayments({
        payments: paymentSource,
        paymentMethodId: fallbackPaymentMethodId,
        fallbackAmount: fallbackPaidAmount,
        total: nextTotal,
        status: nextStatus,
        isDebt: Boolean(body.isDebt ?? oldOrder.isDebt),
        customer: body.customer || oldOrder.customer,
      });
    } catch (error: any) {
      await applyOrderEffects(oldOrder, currentUser);
      return errorResponse(error.message || "بيانات الدفع غير صحيحة", 400);
    }

    const updateBody = {
      ...body,
      items,
      weightItems,
      status: nextStatus,
      order_type: nextOrderType,
      paymentMethod: paymentInfo.paymentMethod,
      paymentMethodId: paymentInfo.paymentMethodId,
      payments: paymentInfo.payments,
      paidAmount: paymentInfo.paidAmount,
      debtAmount: paymentInfo.debtAmount,
      remainingAmount: paymentInfo.remainingAmount,
      isDebt: paymentInfo.isDebt,
      debtStatus: paymentInfo.debtStatus,
      subtotal,
      shipping,
      priceDiff,
      discount: {
        type: discountType,
        value: discountValue,
        amount: discountAmount,
      },
      total: nextTotal,
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
