import axiosClient from "./axios-client";

/**
 * Log an activity to the database
 * @param {Object} activityData - The activity data
 * @param {string} activityData.action - Brief description of the action (e.g., "تم إضافة منتج جديد")
 * @param {string} activityData.actionType - Type of action (e.g., "product_created", "user_updated")
 * @param {string} activityData.createdBy - Name or ID of the user who performed the action
 * @param {string} activityData.severity - Severity level: "info" | "success" | "warning" | "error"
 * @param {string} activityData.details - Detailed description of what happened
 * @param {any} [activityData.metadata] - Optional additional data
 * @returns {Promise<void>}
 */
export async function logActivity({
    action,
    actionType,
    createdBy,
    severity = "info",
    details,
    metadata,
}) {
    try {
        await axiosClient.post("/activities", {
            action,
            actionType,
            createdBy,
            severity,
            details,
            metadata,
        });
    } catch (error) {
        console.error("Failed to log activity:", error);
        // Don't throw error to prevent breaking the main flow
    }
}

/**
 * Predefined activity types for consistency
 */
export const ActivityTypes = {
    // User activities
    USER_CREATED: "user_created",
    USER_UPDATED: "user_updated",
    USER_DELETED: "user_deleted",
    USER_LOGIN: "user_login",
    USER_LOGOUT: "user_logout",

    // Product activities
    PRODUCT_CREATED: "product_created",
    PRODUCT_UPDATED: "product_updated",
    PRODUCT_DELETED: "product_deleted",
    PRODUCT_STOCK_LOW: "product_stock_low",

    // Order activities
    ORDER_CREATED: "order_created",
    ORDER_UPDATED: "order_updated",
    ORDER_CANCELLED: "order_cancelled",
    ORDER_COMPLETED: "order_completed",

    // Payment activities
    PAYMENT_SUCCESS: "payment_success",
    PAYMENT_FAILED: "payment_failed",
    PAYMENT_REFUNDED: "payment_refunded",

    // Category activities
    CATEGORY_CREATED: "category_created",
    CATEGORY_UPDATED: "category_updated",
    CATEGORY_DELETED: "category_deleted",

    // Customer activities
    CUSTOMER_CREATED: "customer_created",
    CUSTOMER_UPDATED: "customer_updated",
    CUSTOMER_DELETED: "customer_deleted",

    // Supplier activities
    SUPPLIER_CREATED: "supplier_created",
    SUPPLIER_UPDATED: "supplier_updated",
    SUPPLIER_DELETED: "supplier_deleted",

    // Service activities
    SERVICE_CREATED: "service_created",
    SERVICE_UPDATED: "service_updated",
    SERVICE_DELETED: "service_deleted",

    // System activities
    SYSTEM_ERROR: "system_error",
    SYSTEM_WARNING: "system_warning",
    SYSTEM_INFO: "system_info",
};

/**
 * Severity levels
 */
export const Severity = {
    INFO: "info",
    SUCCESS: "success",
    WARNING: "warning",
    ERROR: "error",
};

// Example usage:
/*
import { logActivity, ActivityTypes, Severity } from "@/lib/activity-logger";

// Log a product creation
await logActivity({
  action: "تم إضافة منتج جديد",
  actionType: ActivityTypes.PRODUCT_CREATED,
  createdBy: currentUser.name,
  severity: Severity.SUCCESS,
  details: `تم إضافة المنتج "${productName}" بنجاح`,
  metadata: { productId: product._id, price: product.price }
});

// Log an error
await logActivity({
  action: "فشل في حذف المنتج",
  actionType: ActivityTypes.SYSTEM_ERROR,
  createdBy: currentUser.name,
  severity: Severity.ERROR,
  details: `فشل في حذف المنتج رقم ${productId}`,
  metadata: { error: error.message }
});
*/
