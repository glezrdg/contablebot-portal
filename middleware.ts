// Middleware for route protection
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "cb_session";

// Routes that require authentication
const PROTECTED_PAGE_ROUTES = ["/dashboard", "/configuracion"];
const PROTECTED_API_ROUTES = ["/api/invoices", "/api/me"];

// Routes that are always public
const PUBLIC_ROUTES = [
  "/login",
  "/register",
  "/register/complete",
  "/setup-account",
  "/api/login",
  "/api/register",
  "/api/verify-whop-payment",
  "/api/webhooks/whop",
  "/api/setup-account",
  "/api/logout",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if route needs protection
  const isProtectedPage = PROTECTED_PAGE_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedApi = PROTECTED_API_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  // Get the session cookie
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    // No token found
    if (isProtectedApi) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    // Redirect to login for page routes
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Verify the JWT
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET not configured in middleware");
    if (isProtectedApi) {
      return NextResponse.json(
        { error: "Error de configuración" },
        { status: 500 }
      );
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    // Verify the token using jose (Edge-compatible library)
    const secret = new TextEncoder().encode(jwtSecret);
    await jwtVerify(token, secret);

    // Token is valid, continue
    return NextResponse.next();
  } catch (error) {
    console.error("JWT verification failed in middleware:", error);

    if (isProtectedApi) {
      return NextResponse.json({ error: "Sesión inválida" }, { status: 401 });
    }

    // Redirect to login for page routes
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
