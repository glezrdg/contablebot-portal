// Auth utilities for JWT handling and cookie management
import jwt from "jsonwebtoken";
import { serialize, parse } from "./cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import type { JWTPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "";
const COOKIE_NAME = "cb_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Sign a JWT with the given payload
 */
export function signToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  if (!JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return null;
  }
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

/**
 * Set the auth cookie on the response
 */
export function setAuthCookie(res: NextApiResponse, token: string): void {
  const cookie = serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
  res.setHeader("Set-Cookie", cookie);
}

/**
 * Clear the auth cookie
 */
export function clearAuthCookie(res: NextApiResponse): void {
  const cookie = serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  res.setHeader("Set-Cookie", cookie);
}

/**
 * Get the JWT payload from the request cookie
 */
export function getSessionFromRequest(req: NextApiRequest): JWTPayload | null {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Middleware helper to require authentication on an API route
 * Returns the session payload or sends a 401 response
 */
export function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): JWTPayload | null {
  const session = getSessionFromRequest(req);

  if (!session) {
    res.status(401).json({ error: "No autenticado" });
    return null;
  }

  return session;
}
