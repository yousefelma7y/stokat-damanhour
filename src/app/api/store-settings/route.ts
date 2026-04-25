import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import StoreSettings from "@/models/StoreSettings";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

// GET store settings (singleton)
export async function GET() {
  try {
    await connectDB();

    let settings = await StoreSettings.findById("store_settings");

    // If no settings exist yet, create default ones
    if (!settings) {
      settings = await StoreSettings.create({
        _id: "store_settings",
        storeName: "",
        storePhone: "",
        storeLocation: "",
      });
    }

    return successResponse(settings, "Store settings retrieved");
  } catch (error) {
    return handleError(error);
  }
}

// PUT update store settings
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const settings = await StoreSettings.findByIdAndUpdate(
      "store_settings",
      {
        storeName: body.storeName,
        storePhone: body.storePhone,
        storeLocation: body.storeLocation,
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    return successResponse(settings, "Store settings updated");
  } catch (error) {
    return handleError(error);
  }
}
