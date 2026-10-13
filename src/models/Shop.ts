import mongoose, { Document, Model, Schema } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

// Other branches/shops that weight stock can be moved to.
export interface IShop extends Omit<Document, "_id"> {
  _id: number;
  name: string;
  phone?: string;
  location?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopSchema = new Schema<IShop>(
  {
    _id: Number,
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    notes: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

ShopSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("shop");
  }
  next();
});

ShopSchema.index({ isActive: 1, name: 1 });

if (mongoose.models.Shop) {
  delete mongoose.models.Shop;
}

const Shop: Model<IShop> = mongoose.model<IShop>("Shop", ShopSchema);

export default Shop;
