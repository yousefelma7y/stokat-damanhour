import mongoose, { Schema, Document, Model } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

export interface IInvoice extends Omit<Document, "_id"> {
  _id: number;
  invoiceNumber: string;
  from?: any;
  to?: any;
  items?: any[];
  totals?: any;
  paymentInfo?: any;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    _id: Number,
    invoiceNumber: { type: String, required: true, unique: true },
    from: { type: Schema.Types.Mixed },
    to: { type: Schema.Types.Mixed },
    items: [{ type: Schema.Types.Mixed }],
    totals: { type: Schema.Types.Mixed },
    paymentInfo: { type: Schema.Types.Mixed },
  },
  { timestamps: true, _id: false },
);

InvoiceSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("invoice");
  }
  next();
});

const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);
export default Invoice;
