import mongoose, { Document, Model, Schema } from "mongoose";
import { getNextSequence } from "@/lib/sequence";
import "./Shop";

export type WeightMovementType =
  | "add" // supply received into storage
  | "deduct" // manual deduction (damage, loss, ...)
  | "adjust" // stock set to an exact value (stocktaking)
  | "sale" // completed weight order
  | "sale_return" // completed weight order reverted / edited / cancelled
  | "transfer" // moved to another shop
  | "transfer_cancel"; // transfer cancelled, weight returned

export interface IWeightStockMovement extends Omit<Document, "_id"> {
  _id: number;
  type: WeightMovementType;
  direction: "in" | "out";
  weight: number; // kg, always positive
  balanceBefore: number;
  balanceAfter: number;
  shop?: number;
  shopName?: string;
  price?: number; // total value of a transfer (optional)
  isCollected?: boolean; // transfer price received into a wallet
  paymentMethodId?: number;
  paymentMethod?: string;
  transactionId?: number;
  relatedOrderId?: number;
  relatedMovementId?: number; // transfer_cancel -> original transfer
  status: "completed" | "cancelled";
  notes?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WeightStockMovementSchema = new Schema<IWeightStockMovement>(
  {
    _id: Number,
    type: {
      type: String,
      enum: [
        "add",
        "deduct",
        "adjust",
        "sale",
        "sale_return",
        "transfer",
        "transfer_cancel",
      ],
      required: true,
    },
    direction: { type: String, enum: ["in", "out"], required: true },
    weight: { type: Number, required: true, min: 0 },
    balanceBefore: { type: Number, default: 0 },
    balanceAfter: { type: Number, default: 0 },
    shop: { type: Number, ref: "Shop" },
    shopName: String,
    price: { type: Number, default: 0, min: 0 },
    isCollected: { type: Boolean, default: false },
    paymentMethodId: { type: Number, ref: "PaymentMethod" },
    paymentMethod: String,
    transactionId: Number,
    relatedOrderId: Number,
    relatedMovementId: Number,
    status: {
      type: String,
      enum: ["completed", "cancelled"],
      default: "completed",
    },
    notes: String,
    createdBy: String,
  },
  { timestamps: true, _id: false },
);

WeightStockMovementSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("weight-stock-movement");
  }
  next();
});

WeightStockMovementSchema.index({ createdAt: -1 });
WeightStockMovementSchema.index({ type: 1, createdAt: -1 });
WeightStockMovementSchema.index({ shop: 1, createdAt: -1 });
WeightStockMovementSchema.index({ relatedOrderId: 1 });

if (mongoose.models.WeightStockMovement) {
  delete mongoose.models.WeightStockMovement;
}

const WeightStockMovement: Model<IWeightStockMovement> =
  mongoose.model<IWeightStockMovement>(
    "WeightStockMovement",
    WeightStockMovementSchema,
  );

export default WeightStockMovement;
