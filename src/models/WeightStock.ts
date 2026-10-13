import mongoose, { Document, Model, Schema } from "mongoose";

// Single shared storage for everything sold by weight (one document, key "main").
export interface IWeightStock extends Document {
  key: string;
  currentWeight: number; // kg
  totalAdded: number; // kg received into storage
  totalSold: number; // kg sold through orders (net of returns)
  totalTransferred: number; // kg moved to other shops (net of cancellations)
  lowStockThreshold: number; // kg
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WeightStockSchema = new Schema<IWeightStock>(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    currentWeight: { type: Number, default: 0 },
    totalAdded: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    totalTransferred: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 50, min: 0 },
    updatedBy: String,
  },
  { timestamps: true },
);

if (mongoose.models.WeightStock) {
  delete mongoose.models.WeightStock;
}

const WeightStock: Model<IWeightStock> = mongoose.model<IWeightStock>(
  "WeightStock",
  WeightStockSchema,
);

export default WeightStock;
