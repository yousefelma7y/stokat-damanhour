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

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);
export default Order;
