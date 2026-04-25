import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

export interface IAccount extends Omit<Document, "_id"> {
  _id: number;
  accountType: "system" | "supplier" | "customer" | "user";
  entityId?: number;
  entityName: string;
  currentBalance: number;
  totalDebits: number;
  totalCredits: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema<IAccount>(
  {
    _id: Number,
    accountType: {
      type: String,
      enum: ["system", "supplier", "customer", "user"],
      required: true,
    },
    entityId: Number,
    entityName: { type: String, required: true },
    currentBalance: { type: Number, default: 0 },
    totalDebits: { type: Number, default: 0 },
    totalCredits: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

AccountSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("account");
  }
  next();
});

const Account: Model<IAccount> =
  mongoose.models.Account || mongoose.model<IAccount>("Account", AccountSchema);
export default Account;
