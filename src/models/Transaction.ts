import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

export interface ITransaction extends Omit<Document, "_id"> {
  _id: number;
  transactionId: string;
  type: "payment" | "income" | "transfer";
  category?: string; // "income", "expense", etc.
  isExpense?: boolean; // true for payments (money OUT), false for income (money IN)
  from?: string;
  to?: string;
  amount: number;
  gain?: number; // Profit from this transaction
  balanceAfter?: number; // System balance after this transaction
  currency: string;
  paymentMethod?: string;
  paymentMethodId?: number; // Ref to PaymentMethod
  fromWallet?: number; // For transfers
  toWallet?: number; // For transfers
  description?: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  relatedModel?: "Order" | "Supplier" | "Customer" | "User" | "Scrap";
  relatedId?: number;
  createdBy?: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    _id: Number,
    transactionId: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ["payment", "income", "transfer"],
      required: true,
    },
    category: { type: String, default: "income" }, // income, expense, transfer, etc.
    isExpense: { type: Boolean, default: false }, // true for payments (money OUT), false for income (money IN)
    from: { type: String },
    to: { type: String },
    amount: { type: Number, required: true },
    gain: { type: Number, default: 0 },
    balanceAfter: { type: Number },
    currency: { type: String, default: "EGP" },
    paymentMethod: { type: String },
    paymentMethodId: { type: Number, ref: "PaymentMethod" },
    fromWallet: { type: Number, ref: "PaymentMethod" },
    toWallet: { type: Number, ref: "PaymentMethod" },
    description: String,
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "cancelled"],
      default: "pending",
    },
    relatedModel: {
      type: String,
      enum: ["Order", "Supplier", "Customer", "User", "Scrap"],
    },
    relatedId: Number,
    createdBy: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

TransactionSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("transaction");
  }
  next();
});

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);
export default Transaction;
