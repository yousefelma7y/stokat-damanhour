import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

export interface IService extends Omit<Document, "_id"> {
  _id: number;
  name: string;
  description?: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    _id: Number,
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

ServiceSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("service");
  }
  next();
});

const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);
export default Service;
