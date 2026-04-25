import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";
import "./Product"; // Register Product model for population

export interface IScrap extends Omit<Document, "_id"> {
  _id: number;
  name: string;
  size?: string;
  productId?: number;
  stock: number;
  scrapValue: number;
  reason: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ScrapSchema = new Schema<IScrap>(
  {
    _id: Number,
    name: { type: String, required: true },
    size: { type: String },
    productId: { type: Number, ref: "Product" },
    stock: { type: Number, required: true },
    scrapValue: { type: Number, default: 0 },
    reason: { type: String, required: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

ScrapSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("scrap");
  }
  next();
});

const Scrap: Model<IScrap> =
  mongoose.models.Scrap || mongoose.model<IScrap>("Scrap", ScrapSchema);
export default Scrap;
