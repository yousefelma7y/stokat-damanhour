import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStoreSettings extends Omit<Document, "_id"> {
  _id: string;
  storeName: string;
  storePhone: string;
  storeLocation: string;
  createdAt: Date;
  updatedAt: Date;
}

const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    _id: {
      type: String,
      default: "store_settings", // Singleton — only one document
    },
    storeName: {
      type: String,
      default: "",
    },
    storePhone: {
      type: String,
      default: "",
    },
    storeLocation: {
      type: String,
      default: "",
    },
  },
  { timestamps: true, _id: false },
);

// Delete the schema if it exists to ensure clean creation
if (mongoose.models.StoreSettings) {
  delete mongoose.models.StoreSettings;
}

const StoreSettings = mongoose.model<IStoreSettings>(
  "StoreSettings",
  StoreSettingsSchema,
);

export default StoreSettings;
