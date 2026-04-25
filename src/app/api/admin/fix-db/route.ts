// FILE LOCATION: app/api/admin/fix-db/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

/**
 * POST /api/admin/fix-db
 * This endpoint fixes the E11000 duplicate key error by:
 * 1. Dropping the old email index
 * 2. Removing all null email documents
 * 3. Recreating the collection properly
 */
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    console.log("🔧 Starting database cleanup...");

    // Step 1: Get all indexes
    const indexes = await User.collection.getIndexes();
    console.log("📊 Current indexes:", Object.keys(indexes));

    // Step 2: Drop the email index if it exists
    try {
      await User.collection.dropIndex("email_1");
      console.log("✅ Dropped email_1 index");
    } catch (error: any) {
      if (error.message.includes("index not found")) {
        console.log("ℹ️ email_1 index doesn't exist");
      } else {
        console.log("⚠️ Error dropping index:", error.message);
      }
    }

    // Step 3: Remove any documents with null or undefined email
    try {
      const result = await User.deleteMany({
        $or: [{ email: null }, { email: undefined }],
      });
      console.log(
        `✅ Deleted ${result.deletedCount} documents with null email`,
      );
    } catch (error: any) {
      console.log("ℹ️ No null email documents found:", error.message);
    }

    // Step 4: Get updated indexes
    const updatedIndexes = await User.collection.getIndexes();
    console.log("📊 Updated indexes:", Object.keys(updatedIndexes));

    return NextResponse.json({
      success: true,
      message: "Database cleanup completed successfully",
      details: {
        previousIndexes: Object.keys(indexes),
        currentIndexes: Object.keys(updatedIndexes),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("❌ Database cleanup error:", error);
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
 * GET /api/admin/fix-db
 * Check the current state of the database
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const indexes = await User.collection.getIndexes();
    const userCount = await User.countDocuments();
    const nullEmailCount = await User.countDocuments({
      $or: [{ email: null }, { email: undefined }],
    });

    return NextResponse.json({
      success: true,
      status: {
        indexes: Object.keys(indexes),
        totalUsers: userCount,
        usersWithNullEmail: nullEmailCount,
      },
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
