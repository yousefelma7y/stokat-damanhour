// FILE LOCATION: app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Activity from "@/models/Activity";
import { getCurrentUser } from "@/lib/get-current-user";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get the current user BEFORE clearing cookies so we can log who signed out
    const currentUser = await getCurrentUser(request);

    // Log sign-out activity
    if (currentUser) {
      const roleLabel =
        currentUser.role === "admin"
          ? "مدير"
          : currentUser.role === "cashier"
            ? "بائع"
            : "مستخدم";

      await Activity.create({
        action: "تسجيل خروج",
        actionType: "user_logout",
        createdBy: currentUser.userName,
        severity: "info",
        details: `قام "${currentUser.userName}" (${roleLabel}) بتسجيل الخروج`,
        metadata: { userId: currentUser.userId, role: currentUser.role },
      });
    }

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "تم تسجيل الخروج بنجاح",
      },
      { status: 200 },
    );

    // Clear the token cookie
    response.cookies.set({
      name: "token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // This deletes the cookie
      path: "/",
    });

    // Clear user cookie if you're storing user data
    response.cookies.set({
      name: "user",
      value: "",
      httpOnly: false,
      maxAge: 0, // This deletes the cookie
      path: "/",
    });

    // Clear role cookie if you're storing role data
    response.cookies.set({
      name: "role",
      value: "",
      httpOnly: false,
      maxAge: 0, // This deletes the cookie
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تسجيل الخروج",
      },
      { status: 500 },
    );
  }
}
