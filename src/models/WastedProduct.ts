import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

export interface IWastedProduct extends Omit<Document, "_id"> {
  _id: number;
  product: number; // Reference to Product ID
  stock: number;
  condition: "broken" | "defective" | "damaged" | "expired";
  originalPrice?: number;
  reason?: string; // Why it became wasted
  returnedQuantity: number; // Quantity returned to inventory
  returnDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WastedProductSchema = new Schema<IWastedProduct>(
  {
    _id: Number,
    product: {
      type: Number,
      ref: "Product",
      required: true,
    },
    stock: { type: Number, default: 0, min: 0 },
    condition: {
      type: String,
      enum: ["broken", "defective", "damaged", "expired"],
      default: "damaged",
    },
    originalPrice: Number,
    reason: {
      type: String,
      default: "Customer return/replacement",
    },
    returnedQuantity: { type: Number, default: 0, min: 0 },
    returnDate: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

WastedProductSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("wasted_product");
  }
  next();
});

// Index for faster queries
WastedProductSchema.index({ product: 1 });

// Fix for Mongoose model caching in Next.js hot-reloads
if (mongoose.models.WastedProduct) {
  delete (mongoose.models as any).WastedProduct;
}

const WastedProduct: Model<IWastedProduct> = mongoose.model<IWastedProduct>(
  "WastedProduct",
  WastedProductSchema,
);

export default WastedProduct;
