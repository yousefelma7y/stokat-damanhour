import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

export interface ISupplier extends Omit<Document, "_id"> {
  _id: number;
  name: string;
  phone: string;
  wallet: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  note: string;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    _id: Number,
    name: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    wallet: { type: Number, default: 0 },
    note: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

SupplierSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("supplier");
  }
  next();
});

const Supplier: Model<ISupplier> =
  mongoose.models.Supplier ||
  mongoose.model<ISupplier>("Supplier", SupplierSchema);
export default Supplier;
