import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";
import "./Order"; // Register Order model for population

export interface ICustomer extends Omit<Document, "_id"> {
  _id: number;
  name: string;
  phone: string;
  location: string;
  completedOrders: number[];
  totalPayments: number;
  debtBalance: number;
  totalDebt: number;
  totalDebtPaid: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    _id: Number,
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    location: { type: String, required: false },
    completedOrders: [{ type: Number, ref: "Order" }],
    totalPayments: { type: Number, default: 0 },
    debtBalance: { type: Number, default: 0 },
    totalDebt: { type: Number, default: 0 },
    totalDebtPaid: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

CustomerSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("customer");
  }
  next();
});

CustomerSchema.index({ isActive: 1, debtBalance: 1 });
CustomerSchema.index({ phone: 1 });

const Customer: Model<ICustomer> =
  mongoose.models.Customer ||
  mongoose.model<ICustomer>("Customer", CustomerSchema);
export default Customer;
