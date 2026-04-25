import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

export interface IProduct extends Omit<Document, "model" | "_id"> {
  _id: number;
  name: string;
  model?: string;
  size?: string;
  price: number;
  stock: number;
  minStock: number;
  scrap: number;
  barcode?: string;
  category?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    _id: Number,
    name: { type: String, required: true },
    model: String,
    size: String,
    price: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 10 },
    scrap: { type: Number, default: 0 },
    barcode: { type: String, unique: true, sparse: true },
    category: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

ProductSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("product");
  }
  next();
});

ProductSchema.index({ name: "text", model: "text" });
if (mongoose.models.Product) {
  delete mongoose.models.Product;
}

const Product: Model<IProduct> = mongoose.model<IProduct>("Product", ProductSchema);
export default Product;
