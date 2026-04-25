import mongoose from "mongoose";
import Account from "@/models/Account";
import Activity from "@/models/Activity";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Transaction from "@/models/Transaction";
import WeightProduct from "@/models/WeightProduct";
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
            { session },
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

      const normalizedItems = (data.items || []).map((item) => ({
        ...item,
        total: item.total ?? item.quantity * item.price,
      }));

      const normalizedWeightItems = (data.weightItems || []).map((item) => ({
        ...item,
        total: item.total ?? item.weight * item.pricePerKg,
      }));

      const orderNumber =
        data.orderNumber ||
        `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const [order] = await Order.create(
        [
          {
            ...data,
            orderNumber,
            customer: customerId,
            paymentMethod: "cash",
            items: normalizedItems,
            weightItems: normalizedWeightItems,
            createdBy,
          },
        ],
        { session },
      );

      if (data.status === "completed") {
        await this.applyOrderSideEffects(order, customerName, createdBy, session);
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

  private static async applyOrderSideEffects(
    order: any,
    customerName: string,
    createdBy: string,
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

    if (order.customer) {
      await Customer.findByIdAndUpdate(
        order.customer,
        {
          $push: { completedOrders: order._id },
          $inc: { totalPayments: order.total },
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

    systemAccount.currentBalance += order.total || 0;
    systemAccount.totalCredits += order.total || 0;
    await systemAccount.save({ session });

    await Transaction.create(
      [
        {
          transactionId: `TXN-ORD-${order._id}-${Date.now()}`,
          type: "income",
          category: "sales",
          from: `Customer: ${customerName}`,
          to: "system",
          amount: order.total || 0,
          gain: totalGain,
          balanceAfter: systemAccount.currentBalance,
          description: `اوردر رقم #${order._id} (cash)`,
          status: "completed",
          relatedModel: "Order",
          relatedId: order._id,
          paymentMethod: "cash",
          createdBy,
        },
      ],
      { session },
    );

    await Activity.create(
      [
        {
          action: "New Order Created",
          actionType: "order_created",
          createdBy,
          severity: "success",
          details: `Order #${order._id} for ${customerName} processed successfully.`,
          metadata: { orderId: order._id, total: order.total },
        },
      ],
      { session },
    );
  }
}
