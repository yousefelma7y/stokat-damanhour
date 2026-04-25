import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

export interface IWalletEntry {
  paymentMethodId: number;
  name: string;
  actualAmount: number; // What they typed (Opening/Closing based on context, here Closing)
  systemAmount: number; // Opening Balance (per user requirement)
  expectedAmount: number; // Start + Transactions
  difference: number; // actual - system (Net change)
  discrepancy: number; // actual - expected (The mistake)
}

export interface IShiftSummary extends Omit<Document, "_id"> {
  _id: number;
  summaryNumber: string;
  user: number;
  userName: string;
  startTime: Date;
  endTime: Date;

  wallets: IWalletEntry[];
  totalActual: number;
  totalSystem: number;
  totalDifference: number; // Failure or success amount

  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WalletEntrySchema = new Schema<IWalletEntry>(
  {
    paymentMethodId: { type: Number, ref: "PaymentMethod", required: true },
    name: { type: String, default: "" },
    actualAmount: { type: Number, default: 0 },
    systemAmount: { type: Number, default: 0 },
    expectedAmount: { type: Number, default: 0 },
    difference: { type: Number, default: 0 },
    discrepancy: { type: Number, default: 0 },
  },
  { _id: false },
);

const ShiftSummarySchema = new Schema<IShiftSummary>(
  {
    _id: Number,
    summaryNumber: { type: String, required: true, unique: true },
    user: { type: Number, ref: "User", required: true },
    userName: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    wallets: { type: [WalletEntrySchema], default: [] },

    totalActual: { type: Number, default: 0 },
    totalSystem: { type: Number, default: 0 },
    totalDifference: { type: Number, default: 0 },

    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

ShiftSummarySchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("shift_summary");
  }
  next();
});

ShiftSummarySchema.index({ user: 1 });
ShiftSummarySchema.index({ startTime: 1, endTime: 1 });

const ShiftSummary: Model<IShiftSummary> =
  mongoose.models.ShiftSummary ||
  mongoose.model<IShiftSummary>("ShiftSummary", ShiftSummarySchema);

export default ShiftSummary;
