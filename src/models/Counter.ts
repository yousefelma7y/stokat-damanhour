import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICounter extends Document {
  modelName: string;
  sequenceValue: number;
}

const CounterSchema = new Schema<ICounter>({
  modelName: { type: String, required: true, unique: true },
  sequenceValue: { type: Number, default: 0 },
});

const Counter: Model<ICounter> =
  mongoose.models.Counter || mongoose.model<ICounter>("Counter", CounterSchema);

export default Counter;
