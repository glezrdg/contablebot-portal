// Simple cookie parsing utilities (no external dependency needed)
// These are re-exported for convenience

/**
 * Parse a cookie header string into an object
 */
export function parse(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts[0]?.trim();
    const value = parts.slice(1).join("=").trim();
    if (key) {
      cookies[key] = decodeURIComponent(value);
    }
  });

  return cookies;
}

interface SerializeOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
  maxAge?: number;
  path?: string;
  domain?: string;
}

/**
 * Serialize a cookie name-value pair into a Set-Cookie header string
 */
export function serialize(
  name: string,
  value: string,
  options: SerializeOptions = {}
): string {
  const parts: string[] = [`${name}=${encodeURIComponent(value)}`];

  if (options.maxAge !== undefined) {
    parts.push(`Max-Age=${options.maxAge}`);
  }

  if (options.domain) {
    parts.push(`Domain=${options.domain}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.secure) {
    parts.push("Secure");
  }

  if (options.sameSite) {
    parts.push(
      `SameSite=${
        options.sameSite.charAt(0).toUpperCase() + options.sameSite.slice(1)
      }`
    );
  }

  return parts.join("; ");
}
