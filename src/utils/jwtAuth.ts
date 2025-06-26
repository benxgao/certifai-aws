import { jwtVerify } from "jose";
import { logger } from "./logger";

/**
 * Verifies a JWT token using the PUBLIC_JWT_SECRET environment variable
 * @param token - The JWT token to verify
 * @returns Promise<boolean> - True if token is valid, false otherwise
 */
export async function verifyJwtToken(token: string): Promise<boolean> {
  try {
    const publicJwtSecret = process.env.PUBLIC_JWT_SECRET;

    if (!publicJwtSecret) {
      logger.error("PUBLIC_JWT_SECRET environment variable is not set");
      return false;
    }

    // Convert the secret to Uint8Array for jose
    const secret = new TextEncoder().encode(publicJwtSecret);

    // Verify the JWT token
    await jwtVerify(token, secret);

    logger.info("JWT token verification successful");
    return true;
  } catch (error) {
    logger.warn("JWT token verification failed", error);
    return false;
  }
}

/**
 * Extracts JWT token from Authorization header
 * @param authHeader - The Authorization header value
 * @returns string | null - The token if found, null otherwise
 */
export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader) {
    return null;
  }

  // Check for Bearer token format
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (bearerMatch) {
    return bearerMatch[1];
  }

  // Check for empty Bearer format
  if (authHeader.match(/^Bearer\s*$/i)) {
    return "";
  }

  // If no Bearer prefix, assume the entire header is the token
  return authHeader;
}
