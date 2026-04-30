import mongoose from "mongoose";
import Account from "@/models/Account";
import Activity from "@/models/Activity";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import PaymentMethod from "@/models/PaymentMethod";
import Product from "@/models/Product";
import Transaction from "@/models/Transaction";
import WeightProduct from "@/models/WeightProduct";
import { normalizeOrderPayments, roundMoney } from "@/lib/order-payments";
import { CreateOrderInput } from "@/validations/order.schema";

export class OrderService {
  static async createOrder(data: CreateOrderInput, createdBy: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let customerId: number | undefined;
      let customerName = "Cash Customer";

      if (typeof data.customer === "object") {
        let customer = await Customer.findOne({
          phone: data.customer.phone,
          isActive: true,
        }).session(session);

        if (customer) {
          customer.name = data.customer.name;
          customer.location = data.customer.location || "";
          await customer.save({ session });
        } else {
          [customer] = await Customer.create(
            [
              {
                name: data.customer.name,
                phone: data.customer.phone,
                location: data.customer.location || "",
              },
            ],
            { session, ordered: true },
          );
        }

        customerId = customer._id;
        customerName = customer.name;
      } else if (data.customer) {
        customerId = data.customer;
        const customer = await Customer.findById(customerId).session(session);
        customerName = customer?.name || "Customer";
      }

      if (data.status === "completed") {
        await this.validateInventory(data, session);
      }

      const totals = this.normalizeOrderTotals(data);

      const orderNumber =
        data.orderNumber ||
        `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const paymentInfo = await normalizeOrderPayments({
        payments: data.payments,
        paymentMethodId: data.paymentMethodId,
        fallbackAmount: data.paidAmount || totals.total,
        total: totals.total,
        status: data.status,
        isDebt: data.isDebt,
        customer: customerId || data.customer,
        session,
      });

      const [order] = await Order.create(
        [
          {
            ...data,
            ...totals,
            orderNumber,
            customer: customerId,
            paymentMethod: paymentInfo.paymentMethod,
            paymentMethodId: paymentInfo.paymentMethodId,
            payments: paymentInfo.payments,
            paidAmount: paymentInfo.paidAmount,
            debtAmount: paymentInfo.debtAmount,
            remainingAmount: paymentInfo.remainingAmount,
            isDebt: paymentInfo.isDebt,
            debtStatus: paymentInfo.debtStatus,
            createdBy,
          },
        ],
        { session, ordered: true },
      );

      if (data.status === "completed") {
        await this.applyOrderSideEffects(
          order,
          customerName,
          createdBy,
          paymentInfo,
          session,
        );
      }

      await session.commitTransaction();

      const populatedOrder = await Order.findById(order._id)
        .populate("customer", "name phone location")
        .populate("items.product", "name model size price stock")
        .populate("weightItems.weightProduct", "name pricePerKg");

      return populatedOrder || order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  private static async validateInventory(
    data: CreateOrderInput,
    session: mongoose.ClientSession,
  ) {
    for (const item of data.items || []) {
      const product = await Product.findById(item.product).session(session);
      if (!product || product.stock < item.quantity) {
        throw new Error(
          `Insufficient stock for product: ${product?.name || item.product}`,
        );
      }
    }
  }

  private static normalizeOrderTotals(data: CreateOrderInput) {
    const items = (data.items || []).map((item) => {
      const quantity = Number(item.quantity || 0);
      const price = Number(item.price || 0);

      return {
        ...item,
        quantity,
        price,
        total: roundMoney(quantity * price),
      };
    });

    const weightItems = (data.weightItems || []).map((item) => {
      const weight = Number(item.weight || 0);
      const pricePerKg = Number(item.pricePerKg || 0);

      return {
        ...item,
        weight,
        pricePerKg,
        total: roundMoney(weight * pricePerKg),
      };
    });

    const subtotal = roundMoney(
      items.reduce((sum, item) => sum + Number(item.total || 0), 0) +
        weightItems.reduce((sum, item) => sum + Number(item.total || 0), 0),
    );
    const discountType = data.discount?.type || "fixed";
    const discountValue = Number(data.discount?.value || 0);
    const discountAmount =
      discountType === "percentage"
        ? Math.min(subtotal, roundMoney((subtotal * discountValue) / 100))
        : Math.min(subtotal, roundMoney(discountValue));
    const shipping = roundMoney(Number(data.shipping || 0));
    const priceDiff = roundMoney(Number(data.priceDiff || 0));
    const total = roundMoney(
      Math.max(0, subtotal - discountAmount + shipping + priceDiff),
    );

    return {
      items,
      weightItems,
      subtotal,
      shipping,
      priceDiff,
      discount: {
        type: discountType,
        value: discountValue,
        amount: discountAmount,
      },
      total,
    };
  }

  private static async applyOrderSideEffects(
    order: any,
    customerName: string,
    createdBy: string,
    paymentInfo: any,
    session: mongoose.ClientSession,
  ) {
    let totalGain = 0;

    for (const item of order.items || []) {
      const product = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { session, new: true },
      );

      if (product) {
        totalGain += (item.total || item.price * item.quantity);
      }
    }

    for (const item of order.weightItems || []) {
      totalGain += item.total || item.weight * item.pricePerKg;
    }

    const checkoutPayments =
      order.payments && order.payments.length > 0
        ? order.payments
        : order.paymentMethodId && Number(order.paidAmount || 0) > 0
          ? [
              {
                paymentMethodId: order.paymentMethodId,
                name: order.paymentMethod,
                amount: order.paidAmount,
              },
            ]
          : [];
    const paidAtCheckout = roundMoney(
      checkoutPayments.reduce(
        (sum: number, payment: any) => sum + Number(payment.amount || 0),
        0,
      ),
    );
    // Source of truth for debt and payments should be the order document itself
    const remainingAmount = roundMoney(Number(order.remainingAmount || paymentInfo?.remainingAmount || 0));
    const debtAmount = roundMoney(Number(order.debtAmount || paymentInfo?.debtAmount || 0));
    const paidAmount = roundMoney(Number(order.paidAmount || paymentInfo?.paidAmount || 0));

    const customerId =
      order.customer?._id ?? order.customer?.id ?? order.customer;

    if (customerId) {
      await Customer.findByIdAndUpdate(
        customerId,
        {
          $push: { completedOrders: order._id },
          $inc: {
            // totalPayments should reflect actual cash received (paidAmount), not order total
            totalPayments: paidAmount,
            debtBalance: remainingAmount,
            totalDebt: debtAmount,
          },
          $set: { updatedAt: new Date() }
        },
        { session },
      );
    }

    let systemAccount = await Account.findOne({
      accountType: "system",
    }).session(session);

    if (!systemAccount) {
      systemAccount = new Account({
        accountType: "system",
        entityName: "Stockat Damanhour System",
        currentBalance: 0,
      });
    }

    const transactions = [];
    let runningBalance = Number(systemAccount.currentBalance || 0);
    for (const payment of checkoutPayments) {
      const amount = roundMoney(Number(payment.amount || 0));
      if (amount <= 0) continue;

      runningBalance = roundMoney(runningBalance + amount);

      if (payment.paymentMethodId) {
        await PaymentMethod.findByIdAndUpdate(
          payment.paymentMethodId,
          { $inc: { balance: amount } },
          { session },
        );
      }

      transactions.push({
        transactionId: `TXN-ORD-${order._id}-${payment.paymentMethodId}-${Date.now()}`,
        type: "income",
        category: "sales",
        from: `Customer: ${customerName}`,
        to: "system",
        amount,
        gain:
          paidAtCheckout > 0
            ? roundMoney((totalGain * amount) / paidAtCheckout)
            : 0,
        balanceAfter: runningBalance,
        description: `اوردر رقم #${order._id} (${payment.name || order.paymentMethod})`,
        status: "completed",
        relatedModel: "Order",
        relatedId: order._id,
        paymentMethod: payment.name || order.paymentMethod,
        paymentMethodId: payment.paymentMethodId || null,
        createdBy,
      });
    }

    systemAccount.currentBalance = runningBalance;
    systemAccount.totalCredits += paidAtCheckout;
    await systemAccount.save({ session });

    if (transactions.length > 0) {
      await Transaction.create(transactions, { session, ordered: true });
    }

    await Activity.create(
      [
        {
          action: "New Order Created",
          actionType: "order_created",
          createdBy,
          severity: "success",
          details: `Order #${order._id} for ${customerName} processed successfully.`,
          metadata: {
            orderId: order._id,
            total: order.total,
            paidAmount: paidAtCheckout,
            remainingAmount,
          },
        },
      ],
      { session, ordered: true },
    );
  }
}
