import { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

/**
 * Get the current authenticated user from the request
 * @param request - NextRequest object
 * @returns User data or null if not authenticated
 */
export async function getCurrentUser(request: NextRequest) {
  try {
    // Try to get token from cookie
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return null;
    }

    // Verify JWT token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return {
      userId: payload.userId as number,
      userName: payload.userName as string,
      role: payload.role as string,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Get the current user's name for activity logging
 * Returns the userName or "النظام" if no user is found
 */
export async function getCurrentUserName(
  request: NextRequest,
): Promise<string> {
  const user = await getCurrentUser(request);
  return user?.userName || "النظام";
}
