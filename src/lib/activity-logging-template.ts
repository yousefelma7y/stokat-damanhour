/**
 * COMPREHENSIVE ACTIVITY LOGGING TEMPLATE
 *
 * Use this template to add activity logging to any API route
 * Just copy the relevant sections and customize the messages
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
// import YourModel from "@/models/YourModel"; // TEMPLATE: Replace with your actual model
import Activity from "@/models/Activity";
import { getCurrentUserName } from "@/lib/get-current-user";
import {
  successResponse,
  errorResponse,
  handleError,
} from "@/lib/api-response";

// ============================================
// CREATE (POST)
// ============================================
/* TEMPLATE EXAMPLE - Copy and customize for your API routes
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const data = await YourModel.create(body);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم إضافة [اسم الكيان] جديد", // e.g., "تم إضافة خدمة جديدة"
      actionType: "entity_created", // e.g., "service_created"
      createdBy: currentUser,
      severity: "success",
      details: `تم إضافة [الوصف] "${data.name}" بنجاح`, // Customize based on your model
      metadata: { entityId: data._id }, // Add relevant metadata
    });

    return successResponse(data, "Entity created");
  } catch (error) {
    return handleError(error);
  }
}
*/

// ============================================
// UPDATE (PUT) - In [id]/route.ts
// ============================================
/* TEMPLATE EXAMPLE - Copy and customize for your API routes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const body = await request.json();
    const data = await YourModel.findByIdAndUpdate(id, body, { new: true });
    if (!data) return errorResponse("Entity not found", 404);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم تحديث [اسم الكيان]", // e.g., "تم تحديث خدمة"
      actionType: "entity_updated", // e.g., "service_updated"
      createdBy: currentUser,
      severity: "info",
      details: `تم تحديث [الوصف] "${data.name}"`,
      metadata: { entityId: data._id, updates: Object.keys(body) },
    });

    return successResponse(data, "Entity updated");
  } catch (error) {
    return handleError(error);
  }
}
*/

// ============================================
// DELETE (DELETE) - In [id]/route.ts
// ============================================
/* TEMPLATE EXAMPLE - Copy and customize for your API routes
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await connectDB();
    const data = await YourModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );
    if (!data) return errorResponse("Entity not found", 404);

    // Get current user
    const currentUser = await getCurrentUserName(request);

    // Log activity
    await Activity.create({
      action: "تم حذف [اسم الكيان]", // e.g., "تم حذف خدمة"
      actionType: "entity_deleted", // e.g., "service_deleted"
      createdBy: currentUser,
      severity: "warning",
      details: `تم حذف [الوصف] "${data.name}"`,
      metadata: { entityId: data._id },
    });

    return successResponse(data, "Entity deleted");
  } catch (error) {
    return handleError(error);
  }
}
*/

// ============================================
// ACTIVITY TYPE REFERENCE
// ============================================
/*
Use these consistent action types:

Services:
- service_created
- service_updated
- service_deleted

Scraps:
- scrap_created
- scrap_updated
- scrap_deleted

Invoices:
- invoice_created
- invoice_updated
- invoice_deleted

Transactions:
- transaction_created
- transaction_updated
- transaction_deleted

Shifts:
- shift_created
- shift_updated
- shift_deleted

Accounts:
- account_created
- account_updated
- account_deleted

Factory Products:
- factory_product_created
- factory_product_updated
- factory_product_deleted
- factory_product_returned

Wasted Products:
- wasted_product_created
- wasted_product_updated
- wasted_product_deleted
- wasted_product_returned
*/
