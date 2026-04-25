import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

export interface IPaymentMethod extends Omit<Document, "_id"> {
  _id: number;
  name: string;
  type: "cash" | "bank" | "wallet" | "other";
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    _id: Number,
    name: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["cash", "bank", "wallet", "other"],
      default: "cash",
    },
    balance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

PaymentMethodSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("payment_method");
  }
  next();
});

const PaymentMethod: Model<IPaymentMethod> =
  mongoose.models.PaymentMethod ||
  mongoose.model<IPaymentMethod>("PaymentMethod", PaymentMethodSchema);

export default PaymentMethod;
