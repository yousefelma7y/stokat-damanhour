import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

// ─── Wallet entry sub-type ────────────────────────────────────────────────────
export interface IWalletEntry {
  paymentMethodId: number;
  name: string; // denormalised payment method name for display
  amount: number;
}

export interface IShift extends Omit<Document, "_id"> {
  _id: number;
  shiftNumber: string;
  user: number;
  startTime: Date;
  endTime?: Date;

  // ── Opening ──────────────────────────────────────────────────────────────
  startingBalance: number; // sum of all startWallets amounts
  startWallets: IWalletEntry[]; // per-payment-method opening balances

  // ── Closing ──────────────────────────────────────────────────────────────
  closingBalance?: number; // sum of all closeWallets amounts
  closeWallets?: IWalletEntry[]; // per-payment-method closing balances

  totalSales: number;
  status: "active" | "closed";
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Reusable sub-schema ──────────────────────────────────────────────────────
const WalletEntrySchema = new Schema<IWalletEntry>(
  {
    paymentMethodId: { type: Number, ref: "PaymentMethod", required: true },
    name: { type: String, default: "" }, // stored for fast display
    amount: { type: Number, default: 0 },
  },
  { _id: false }, // no extra _id per entry
);

// ─── Main schema ──────────────────────────────────────────────────────────────
const ShiftSchema = new Schema<IShift>(
  {
    _id: Number,
    shiftNumber: { type: String, required: true, unique: true },
    user: { type: Number, ref: "User", required: true },
    startTime: { type: Date, default: Date.now },
    endTime: Date,

    // Opening
    startingBalance: { type: Number, required: true, default: 0 },
    startWallets: { type: [WalletEntrySchema], default: [] },

    // Closing
    closingBalance: { type: Number },
    closeWallets: { type: [WalletEntrySchema], default: [] },

    totalSales: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "closed"], default: "active" },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

// ─── Auto-increment _id ───────────────────────────────────────────────────────
ShiftSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("shift");
  }
  next();
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
ShiftSchema.index({ user: 1 });
ShiftSchema.index({ status: 1 });
ShiftSchema.index({ startTime: 1 });
ShiftSchema.index({ isActive: 1 });

const Shift: Model<IShift> =
  mongoose.models.Shift || mongoose.model<IShift>("Shift", ShiftSchema);

export default Shift;
