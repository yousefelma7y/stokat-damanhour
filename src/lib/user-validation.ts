import { NextResponse } from "next/server";
import User from "@/models/User";

export type FieldErrors = Record<string, string>;

const ROLES = ["admin", "cashier", "accountant"];
const PHONE_REGEX = /^01[0-9]{9}$/;

const isBlank = (v: unknown) =>
  v === undefined || v === null || String(v).trim() === "";

/**
 * Validates a user payload and returns every field error at once.
 * - mode "create": all required fields must be present (including password).
 * - mode "update": only fields present in the body are validated.
 */
export async function validateUserPayload(
  body: any,
  mode: "create" | "update",
  excludeId?: number | string,
): Promise<FieldErrors> {
  const errors: FieldErrors = {};
  const has = (key: string) => mode === "create" || key in body;

  if (has("userName")) {
    if (isBlank(body.userName)) {
      errors.userName = "اسم المستخدم مطلوب";
    } else if (String(body.userName).trim().length < 3) {
      errors.userName = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
    } else {
      const filter: any = {
        userName: String(body.userName).trim().toLowerCase(),
      };
      if (excludeId !== undefined) filter._id = { $ne: Number(excludeId) };
      const exists = await User.exists(filter);
      if (exists) errors.userName = "اسم المستخدم مستخدم بالفعل";
    }
  }

  if (has("phone")) {
    if (isBlank(body.phone)) {
      errors.phone = "رقم الهاتف مطلوب";
    } else if (!PHONE_REGEX.test(String(body.phone).trim())) {
      errors.phone = "رقم الهاتف يجب أن يكون 11 رقم ويبدأ بـ 01";
    }
  }

  if (has("role")) {
    if (isBlank(body.role)) {
      errors.role = "الوظيفة مطلوبة";
    } else if (!ROLES.includes(body.role)) {
      errors.role = "الوظيفة غير صالحة";
    }
  }

  if (has("location") && isBlank(body.location)) {
    errors.location = "العنوان مطلوب";
  }

  if (has("salary")) {
    if (isBlank(body.salary)) {
      errors.salary = "الراتب مطلوب";
    } else if (isNaN(Number(body.salary))) {
      errors.salary = "الراتب يجب أن يكون رقم";
    } else if (Number(body.salary) < 0) {
      errors.salary = "الراتب لا يمكن أن يكون سالب";
    }
  }

  if (mode === "create" || !isBlank(body.password)) {
    if (isBlank(body.password)) {
      errors.password = "كلمة المرور مطلوبة";
    } else if (String(body.password).length < 6) {
      errors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }
  }

  return errors;
}

export function validationErrorResponse(errors: FieldErrors, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message: Object.values(errors).join(" - "),
      errors,
    },
    { status },
  );
}

/**
 * Converts Mongoose validation / duplicate-key errors into field errors.
 * Returns null if the error is not one of those.
 */
export function mongooseErrorToFieldErrors(error: any): FieldErrors | null {
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0];
    if (field === "userName") return { userName: "اسم المستخدم مستخدم بالفعل" };
    return { [field || "general"]: "هذه القيمة مستخدمة بالفعل" };
  }
  if (error?.name === "ValidationError" && error.errors) {
    const out: FieldErrors = {};
    for (const [key, err] of Object.entries<any>(error.errors)) {
      out[key] = err.kind === "required" ? "هذا الحقل مطلوب" : "قيمة غير صالحة";
    }
    return out;
  }
  if (error?.name === "CastError" && error.path) {
    return { [error.path]: "قيمة غير صالحة" };
  }
  return null;
}
