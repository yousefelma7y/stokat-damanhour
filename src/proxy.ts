import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  ROLE_PERMISSIONS,
  UserRole,
  getAccessiblePages,
} from "@/lib/permissions";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Define public routes (no auth needed)
  const publicRoutes = ["/signin", "/"];

  // Define protected routes (auth required)
  const protectedRoutes = ["/dashboard"];

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(route),
  );

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // Get cookies
  const token = request.cookies.get("token")?.value;
  const userCookie = request.cookies.get("user")?.value;

  // CASE 1: User is trying to access protected route
  if (isProtectedRoute) {
    // Check if user has token AND user cookie
    if (!token || !userCookie) {
      // Not logged in, redirect to signin
      return NextResponse.redirect(new URL("/signin", request.url));
    }

    // Try to verify token
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, secret);

      // ✅ Token is valid
      // Now check Role Based Access Control (RBAC)
      const role = request.cookies.get("role")?.value as UserRole | undefined;

      if (role && ROLE_PERMISSIONS[role] && pathname.startsWith("/dashboard")) {
        // Extract the page key from the URL
        const segments = pathname.split("/").filter(Boolean);
        // segments[0] is "dashboard"
        // segments[1] is the page key (or undefined if just /dashboard)

        let pageKey = "dashboard";
        if (segments.length > 1) {
          pageKey = segments[1];
        }

        // Check permissions
        const rolePermissions = ROLE_PERMISSIONS[role];

        // Only check if we have a specific permission definition for this page
        // If pageKey isn't in permissions (e.g. unknown route), we might want to let it pass or block.
        // For now, assuming if it's in permissions, we check.
        if (rolePermissions.pages[pageKey]) {
          const pagePermission = rolePermissions.pages[pageKey];
          if (!pagePermission.canView) {
            // User does not have permission
            // Redirect to their first accessible page
            const accessiblePages = getAccessiblePages(role);
            const defaultPage = accessiblePages[0];

            const url = request.nextUrl.clone();
            if (!defaultPage) {
              // No accessible pages? Send to signin
              url.pathname = "/signin";
            } else {
              // accessiblePages returns keys like "create-order", "dashboard"
              if (defaultPage === "dashboard") {
                url.pathname = "/dashboard";
              } else {
                url.pathname = `/dashboard/${defaultPage}`;
              }
            }
            return NextResponse.redirect(url);
          }
        }
      }

      // ✅ Token is valid, allow access
      return NextResponse.next();
    } catch (error) {
      // ❌ Token is invalid/expired
      console.log("❌ Token invalid/expired - redirecting to signin");

      // Clear cookies by setting them to empty
      const response = NextResponse.redirect(new URL("/signin", request.url));
      response.cookies.set("token", "", { maxAge: 0 });
      response.cookies.set("user", "", { maxAge: 0 });
      response.cookies.set("role", "", { maxAge: 0 });

      return response;
    }
  }

  // CASE 2: User is trying to access public auth routes while logged in
  if (isPublicRoute && token && userCookie) {
    // Check if token is actually valid before redirecting
    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      await jwtVerify(token, secret);
      // ✅ User is logged in and trying to access signin page
      // Redirect them to dashboard or their default page
      const role = request.cookies.get("role")?.value as UserRole | undefined;
      let targetPath = "/dashboard";

      if (role && ROLE_PERMISSIONS[role]) {
        const accessiblePages = getAccessiblePages(role);
        const defaultPage = accessiblePages[0];
        if (defaultPage) {
          targetPath =
            defaultPage === "dashboard"
              ? "/dashboard"
              : `/dashboard/${defaultPage}`;
        }
      }

      return NextResponse.redirect(new URL(targetPath, request.url));
    } catch (error) {
      // Token is invalid, let them access signin (and maybe clear cookies)
      return NextResponse.next();
    }
  }

  // CASE 3: User is accessing public route without login (allowed)
  return NextResponse.next();
}

// Configure which routes use middleware
export const config = {
  matcher: [
    // Protected routes
    "/dashboard/:path*",
    // Public auth routes
    "/signin",
    // Root
    "/",
  ],
};
