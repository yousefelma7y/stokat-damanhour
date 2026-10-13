import mongoose, { Document, Model, Schema } from "mongoose";
import { getNextSequence } from "@/lib/sequence";

// Balances of things that physically exist and therefore carry across seasons.
export interface ISeasonBalances {
  systemBalance: number;
  wallets: { paymentMethodId: number; name: string; type?: string; balance: number }[];
  walletsTotal: number;
  customerDebt: number;
  customersWithDebt: number;
  supplierWallets: number;
  weightStockKg: number;
  productsCount: number;
  productsStockQty: number;
  productsStockValue: number;
}

// Activity of the season itself. These restart from zero in the next season.
export interface ISeasonTotals {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalGain: number;
  transactionsCount: number;
  ordersCount: number;
  completedOrders: number;
  cancelledOrders: number;
  ordersValue: number;
  weightSoldKg: number;
  weightAddedKg: number;
  weightTransferredKg: number;
  weightTransferValue: number;
  debtCreated: number;
  debtCollected: number;
}

export interface ISeason extends Omit<Document, "_id"> {
  _id: number;
  name: string;
  status: "open" | "closed";
  startDate: Date;
  endDate?: Date;
  opening: ISeasonBalances;
  closing?: ISeasonBalances; // snapshot taken at close
  totals?: ISeasonTotals; // snapshot taken at close
  notes?: string;
  openedBy?: string;
  closedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BalancesSchema = new Schema<ISeasonBalances>(
  {
    systemBalance: { type: Number, default: 0 },
    wallets: [
      {
        _id: false,
        paymentMethodId: Number,
        name: String,
        type: { type: String },
        balance: { type: Number, default: 0 },
      },
    ],
    walletsTotal: { type: Number, default: 0 },
    customerDebt: { type: Number, default: 0 },
    customersWithDebt: { type: Number, default: 0 },
    supplierWallets: { type: Number, default: 0 },
    weightStockKg: { type: Number, default: 0 },
    productsCount: { type: Number, default: 0 },
    productsStockQty: { type: Number, default: 0 },
    productsStockValue: { type: Number, default: 0 },
  },
  { _id: false },
);

const TotalsSchema = new Schema<ISeasonTotals>(
  {
    totalIncome: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    totalGain: { type: Number, default: 0 },
    transactionsCount: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 0 },
    completedOrders: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    ordersValue: { type: Number, default: 0 },
    weightSoldKg: { type: Number, default: 0 },
    weightAddedKg: { type: Number, default: 0 },
    weightTransferredKg: { type: Number, default: 0 },
    weightTransferValue: { type: Number, default: 0 },
    debtCreated: { type: Number, default: 0 },
    debtCollected: { type: Number, default: 0 },
  },
  { _id: false },
);

const SeasonSchema = new Schema<ISeason>(
  {
    _id: Number,
    name: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    startDate: { type: Date, required: true },
    endDate: Date,
    opening: { type: BalancesSchema, default: () => ({}) },
    closing: BalancesSchema,
    totals: TotalsSchema,
    notes: String,
    openedBy: String,
    closedBy: String,
  },
  { timestamps: true, _id: false },
);

SeasonSchema.pre("save", async function (next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("season");
  }
  next();
});

// Only one season can be open at a time.
SeasonSchema.index(
  { status: 1 },
  { unique: true, partialFilterExpression: { status: "open" } },
);
SeasonSchema.index({ startDate: -1 });

if (mongoose.models.Season) {
  delete mongoose.models.Season;
}

const Season: Model<ISeason> = mongoose.model<ISeason>("Season", SeasonSchema);

export default Season;
