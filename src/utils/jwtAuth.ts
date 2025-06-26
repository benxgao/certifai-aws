import { jwtVerify, createRemoteJWKSet, JWTPayload } from 'jose';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { logger } from './logger';

export interface JWTVerificationResult {
  isValid: boolean;
  payload?: JWTPayload;
  error?: string;
}

/**
 * Extract JWT token from Authorization header
 */
export function extractToken(event: APIGatewayProxyEvent): string | null {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader) {
    return null;
  }

  // Extract token from "Bearer <token>" format
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/**
 * Verify JWT token using the PUBLIC_JWT_SECRET environment variable
 */
export async function verifyJWT(token: string): Promise<JWTVerificationResult> {
  try {
    const publicJwtSecret = process.env.PUBLIC_JWT_SECRET;
    
    if (!publicJwtSecret) {
      logger.error('PUBLIC_JWT_SECRET environment variable not configured');
      return {
        isValid: false,
        error: 'JWT verification not configured'
      };
    }

    // Convert the secret to Uint8Array for jose
    const secret = new TextEncoder().encode(publicJwtSecret);

    // Verify the JWT
    const { payload } = await jwtVerify(token, secret);

    logger.info('JWT verification successful', {
      subject: payload.sub,
      issuer: payload.iss,
      expiresAt: payload.exp
    });

    return {
      isValid: true,
      payload
    };

  } catch (error) {
    logger.warn('JWT verification failed', error);
    
    let errorMessage = 'Invalid token';
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        errorMessage = 'Token expired';
      } else if (error.message.includes('signature')) {
        errorMessage = 'Invalid token signature';
      }
    }

    return {
      isValid: false,
      error: errorMessage
    };
  }
}

/**
 * Middleware function to verify JWT from API Gateway event
 */
export async function verifyJWTFromEvent(event: APIGatewayProxyEvent): Promise<JWTVerificationResult> {
  const token = extractToken(event);
  
  if (!token) {
    return {
      isValid: false,
      error: 'Authorization token required'
    };
  }

  return await verifyJWT(token);
}
