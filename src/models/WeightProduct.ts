import mongoose, { Document, Model, Schema } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

export interface IWeightProduct extends Omit<Document, "_id"> {
  _id: number;
  name: string;
  pricePerKg: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WeightProductSchema = new Schema<IWeightProduct>(
  {
    _id: Number,
    name: { type: String, required: true, trim: true },
    pricePerKg: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

WeightProductSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("weight-product");
  }
  next();
});

WeightProductSchema.index({ name: "text" });

if (mongoose.models.WeightProduct) {
  delete mongoose.models.WeightProduct;
}

const WeightProduct: Model<IWeightProduct> = mongoose.model<IWeightProduct>(
  "WeightProduct",
  WeightProductSchema,
);

export default WeightProduct;
