import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

export interface IActivity extends Omit<Document, "_id"> {
  _id: number;
  action: string;
  actionType: string;
  createdBy: string;
  severity: "info" | "success" | "warning" | "error";
  details: string;
  metadata?: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    _id: Number,
    action: { type: String, required: true },
    actionType: { type: String, required: true },
    createdBy: { type: String, required: true },
    severity: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      default: "info",
    },
    details: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, _id: false },
);

ActivitySchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("activity");
  }
  next();
});

const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);
export default Activity;
