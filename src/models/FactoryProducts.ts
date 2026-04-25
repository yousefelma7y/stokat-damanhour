// FILE LOCATION: models/FactoryProducts.ts

import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

export interface IFactoryProduct extends Omit<Document, "_id"> {
  _id: number;
  productName: "بطارية جافة" | "بطارية مية" | "رصاص";
  stock: number;
  returnedQuantity: number; // Quantity returned to inventory
  returnDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FactoryProductSchema = new Schema<IFactoryProduct>(
  {
    _id: Number,
    productName: {
      type: String,
      required: true,
      enum: ["بطارية جافة", "بطارية مية", "رصاص"],
    },
    stock: { type: Number, default: 0, min: 0 },
    returnedQuantity: { type: Number, default: 0, min: 0 },
    returnDate: Date,
  },
  { timestamps: true, _id: false },
);

FactoryProductSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("factory_product");
  }
  next();
});

// Index for faster queries
FactoryProductSchema.index({ productName: 1 });

// Fix for Mongoose model caching in Next.js hot-reloads
if (mongoose.models.FactoryProduct) {
  delete (mongoose.models as any).FactoryProduct;
}

const FactoryProduct: Model<IFactoryProduct> = mongoose.model<IFactoryProduct>(
  "FactoryProduct",
  FactoryProductSchema,
);

export default FactoryProduct;
