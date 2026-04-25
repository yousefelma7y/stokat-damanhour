import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Counter from "@/models/Counter";
import User from "@/models/User";
import Activity from "@/models/Activity";
import Product from "@/models/Product";
import Customer from "@/models/Customer";
import Supplier from "@/models/Supplier";

/**
 * POST /api/admin/fix-sequences
 * This endpoint fixes sequence counter issues by resetting them to the max ID + 1
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    console.log("🔧 Starting sequence counter fix...");

    const results: any = {};

    // Fix User sequence
    const maxUser = await User.findOne().sort({ _id: -1 }).limit(1);
    if (maxUser) {
      await Counter.findOneAndUpdate(
        { modelName: "user" },
        { sequenceValue: maxUser._id + 1 },
        { upsert: true },
      );
      results.user = {
        maxId: maxUser._id,
        newSequence: maxUser._id + 1,
      };
      console.log(`✅ User sequence reset to ${maxUser._id + 1}`);
    }

    // Fix Activity sequence
    const maxActivity = await Activity.findOne().sort({ _id: -1 }).limit(1);
    if (maxActivity) {
      await Counter.findOneAndUpdate(
        { modelName: "activity" },
        { sequenceValue: maxActivity._id + 1 },
        { upsert: true },
      );
      results.activity = {
        maxId: maxActivity._id,
        newSequence: maxActivity._id + 1,
      };
      console.log(`✅ Activity sequence reset to ${maxActivity._id + 1}`);
    }

    // Fix Product sequence
    const maxProduct = await Product.findOne().sort({ _id: -1 }).limit(1);
    if (maxProduct) {
      await Counter.findOneAndUpdate(
        { modelName: "product" },
        { sequenceValue: maxProduct._id + 1 },
        { upsert: true },
      );
      results.product = {
        maxId: maxProduct._id,
        newSequence: maxProduct._id + 1,
      };
      console.log(`✅ Product sequence reset to ${maxProduct._id + 1}`);
    }

    // Fix Customer sequence
    const maxCustomer = await Customer.findOne().sort({ _id: -1 }).limit(1);
    if (maxCustomer) {
      await Counter.findOneAndUpdate(
        { modelName: "customer" },
        { sequenceValue: maxCustomer._id + 1 },
        { upsert: true },
      );
      results.customer = {
        maxId: maxCustomer._id,
        newSequence: maxCustomer._id + 1,
      };
      console.log(`✅ Customer sequence reset to ${maxCustomer._id + 1}`);
    }

    // Fix Supplier sequence
    const maxSupplier = await Supplier.findOne().sort({ _id: -1 }).limit(1);
    if (maxSupplier) {
      await Counter.findOneAndUpdate(
        { modelName: "supplier" },
        { sequenceValue: maxSupplier._id + 1 },
        { upsert: true },
      );
      results.supplier = {
        maxId: maxSupplier._id,
        newSequence: maxSupplier._id + 1,
      };
      console.log(`✅ Supplier sequence reset to ${maxSupplier._id + 1}`);
    }

    return NextResponse.json({
      success: true,
      message: "Sequence counters fixed successfully",
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Sequence fix error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        error: error.stack,
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/admin/fix-sequences
 * Check the current state of sequence counters
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const counters = await Counter.find({});
    const maxIds: any = {};

    // Get max IDs for each model
    const maxUser = await User.findOne().sort({ _id: -1 }).limit(1);
    if (maxUser) maxIds.user = maxUser._id;

    const maxActivity = await Activity.findOne().sort({ _id: -1 }).limit(1);
    if (maxActivity) maxIds.activity = maxActivity._id;

    const maxProduct = await Product.findOne().sort({ _id: -1 }).limit(1);
    if (maxProduct) maxIds.product = maxProduct._id;

    const maxCustomer = await Customer.findOne().sort({ _id: -1 }).limit(1);
    if (maxCustomer) maxIds.customer = maxCustomer._id;

    const maxSupplier = await Supplier.findOne().sort({ _id: -1 }).limit(1);
    if (maxSupplier) maxIds.supplier = maxSupplier._id;

    return NextResponse.json({
      success: true,
      counters: counters.map((c) => ({
        model: c.modelName,
        currentSequence: c.sequenceValue,
        maxIdInDb: maxIds[c.modelName] || 0,
        needsFix: c.sequenceValue <= (maxIds[c.modelName] || 0),
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
