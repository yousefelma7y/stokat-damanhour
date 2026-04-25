// FILE LOCATION: models/User.ts

import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import { getNextSequence } from "@/lib/sequence";

export interface IUser extends Omit<Document, "_id"> {
  _id: number;
  userName: string;
  password: string;
  brandName: string;
  location: string;
  phone: string;
  logo?: string;
  role: string;
  isActive: boolean;
  salary: number;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(passwordToCheck: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    _id: Number,
    userName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    salary: {
      type: Number,
      default: 0,
    },
    password: {
      type: String,
      required: true,
      select: false, // Don't return password by default
    },
    brandName: {
      type: String,
      required: false,
    },
    location: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "cashier", "accountant"],
      default: "admin",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, _id: false },
);

// Index for searching by phone
UserSchema.index({ phone: 1 });

// Index for role-based queries
UserSchema.index({ role: 1 });

// Index for active users
UserSchema.index({ isActive: 1 });

// Hash password and handle auto-increment before saving
UserSchema.pre("save", async function (next) {
  // Auto-increment ID
  if (this.isNew && !this._id) {
    this._id = await getNextSequence("user");
  }

  // Password hashing
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Hash password on update operations (findOneAndUpdate, findByIdAndUpdate)
UserSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as any;

  // Check if password is being updated
  if (update.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(update.password, salt);
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function (
  passwordToCheck: string,
): Promise<boolean> {
  return await bcrypt.compare(passwordToCheck, this.password);
};

// Delete the schema if it exists to ensure clean creation
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
