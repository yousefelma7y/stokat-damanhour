import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";
import "./Service"; // Register Service model
import "./Scrap"; // Register Scrap model
import "./Product"; // Register Product model
import "./Customer"; // Register Customer model
import "./Supplier"; // Register Supplier model
import "./WeightProduct";

interface IOrderItem {
  product: number;
  quantity: number;
  price: number;
  total: number;
  size?: string;
  refModel?: "Product" | "Scrap"; // Added to handle scrap items correctly
}

interface IOrderDiscount {
  type?: string;
  value?: number;
  amount?: number;
}

interface IOrderPayment {
  paymentMethodId: number;
  name?: string;
  amount: number;
}

interface IOrderDebtSettlement {
  amount: number;
  paymentMethodId?: number;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: Date;
}

interface IOrderWeightItem {
  weightProduct: number;
  weight: number;
  pricePerKg: number;
  total: number;
}

export interface IOrder extends Omit<Document, "_id"> {
  _id: number;
  orderNumber: string;
  customer?: number;
  items: IOrderItem[];
  weightItems?: IOrderWeightItem[];
  discount?: IOrderDiscount;
  shipping?: number;
  priceDiff?: number;
  subtotal?: number;
  total: number;
  status: "pending" | "completed" | "cancelled";
  order_type?: "regular" | "weight";
  paymentMethod?: string;
  paymentMethodId?: number; // Ref to PaymentMethod
  payments?: IOrderPayment[];
  paidAmount?: number;
  debtAmount?: number;
  remainingAmount?: number;
  isDebt?: boolean;
  debtStatus?: "none" | "open" | "partial" | "settled";
  debtSettlements?: IOrderDebtSettlement[];
  notes?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    _id: Number,
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: Number, ref: "Customer", required: false },
    items: [
      {
        product: { type: Number, ref: "Product" },
        quantity: Number,
        price: Number,
        total: Number,
        size: String,
      },
    ],
    weightItems: [
      {
        weightProduct: { type: Number, ref: "WeightProduct" },
        weight: Number,
        pricePerKg: Number,
        total: Number,
      },
    ],
    discount: {
      type: { type: String, default: "fixed" },
      value: { type: Number, default: 0 },
      amount: { type: Number, default: 0 },
    },
    shipping: { type: Number, default: 0 },
    priceDiff: { type: Number, default: 0 },
    subtotal: Number,
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    order_type: {
      type: String,
      enum: ["regular", "weight"],
      default: "regular",
    },
    paymentMethod: { type: String, default: "cash" },
    paymentMethodId: { type: Number, ref: "PaymentMethod" },
    payments: [
      {
        paymentMethodId: { type: Number, ref: "PaymentMethod", required: true },
        name: String,
        amount: { type: Number, required: true, min: 0 },
      },
    ],
    paidAmount: { type: Number, default: 0 },
    debtAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    isDebt: { type: Boolean, default: false },
    debtStatus: {
      type: String,
      enum: ["none", "open", "partial", "settled"],
      default: "none",
    },
    debtSettlements: [
      {
        amount: { type: Number, required: true, min: 0 },
        paymentMethodId: { type: Number, ref: "PaymentMethod" },
        paymentMethod: String,
        transactionId: String,
        notes: String,
        createdBy: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    notes: String,
    isActive: { type: Boolean, default: true },
    createdBy: String,
  },
  { timestamps: true, _id: false },
);

OrderSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("order");
  }
  next();
});

// Indexes for better query performance
OrderSchema.index({ customer: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ order_type: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ isActive: 1 });
OrderSchema.index({ customer: 1, status: 1, remainingAmount: 1, isActive: 1 });

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
