// FILE LOCATION: app/api/auth/login/route.ts

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Activity from "@/models/Activity";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";
const JWT_EXPIRES_IN = "7d";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { userName, password } = body;

    // Validate input
    if (!userName || !password) {
      return NextResponse.json(
        { success: false, message: "اسم المستخدم وكلمة السر غير صحيحة" },
        { status: 400 },
      );
    }

    // Find user and include password field (it's normally excluded)
    const user = await User.findOne({
      userName: userName.toLowerCase(),
    }).select("+password");

    if (!user) {
      return NextResponse.json(
        { success: false, message: "اسم المستخدم وكلمة السر غير صحيحة" },
        { status: 401 },
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "حساب المستخدم غير نشط" },
        { status: 403 },
      );
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: "اسم المستخدم وكلمة السر غير صحيحة" },
        { status: 401 },
      );
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        userName: user.userName,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );

    // Prepare user data (without password)
    const userData = {
      _id: user._id,
      userName: user.userName,
      brandName: user.brandName,
      location: user.location,
      phone: user.phone,
      logo: user.logo,
      role: user.role,
    };

    // Create response
    const response = NextResponse.json(
      {
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        user: userData,
        token: token,
      },
      { status: 200 },
    );

    // ✅ Set HTTP-only cookie for token (IMPORTANT!)
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true, // Cannot be accessed by JavaScript
      secure: process.env.NODE_ENV === "production", // Only HTTPS in production
      sameSite: "lax", // Allow some cross-site requests
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      path: "/",
    });

    // ✅ Set user cookie (optional - for frontend use)
    response.cookies.set({
      name: "user",
      value: JSON.stringify(userData),
      httpOnly: false, // Can be accessed by JavaScript
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // ✅ Set role cookie (optional - for quick access)
    response.cookies.set({
      name: "role",
      value: user.role,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    // Log sign-in activity
    const roleLabel =
      user.role === "admin"
        ? "مدير"
        : user.role === "cashier"
          ? "بائع"
          : "مستخدم";

    await Activity.create({
      action: "تسجيل دخول",
      actionType: "user_login",
      createdBy: user.userName,
      severity: "info",
      details: `قام "${user.userName}" (${roleLabel}) بتسجيل الدخول`,
      metadata: { userId: user._id, role: user.role },
    });

    console.log("✅ تم تسجيل الدخول بنجاح:", user.userName);
    console.log("✅ تم تعيين الكوكيز:", {
      token: "***",
      user: userData.userName,
      role: user.role,
    });

    return response;
  } catch (error: any) {
    console.error("❌ حدث خطأ أثناء تسجيل الدخول:", error);
    return NextResponse.json(
      {
        success: false,
        message: "حدث خطأ أثناء تسجيل الدخول",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
