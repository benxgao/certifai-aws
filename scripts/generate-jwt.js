#!/usr/bin/env node

/**
 * JWT Token Generator for PUBLIC_JWT_SECRET
 *
 * This script generates JWT tokens using the same secret that the Lambda function uses.
 * Usage: node generate-jwt.js [payload] [expiration]
 *
 * Examples:
 *   node generate-jwt.js
 *   node generate-jwt.js '{"userId":"123","role":"admin"}' '24h'
 *   PUBLIC_JWT_SECRET=my-secret node generate-jwt.js
 */

import { SignJWT } from "jose";

async function generateJWT(payload = {}, expirationTime = "1h") {
  try {
    // Get the secret from environment variable
    const secret = process.env.PUBLIC_JWT_SECRET || "default-secret-key";

    if (secret === "default-secret-key") {
      console.warn(
        "⚠️  Warning: Using default secret. Set PUBLIC_JWT_SECRET environment variable for production use."
      );
    }

    // Convert secret to Uint8Array
    const secretKey = new TextEncoder().encode(secret);

    // Create default payload if none provided
    const defaultPayload = {
      userId: "demo-user",
      email: "demo@example.com",
      role: "user",
      ...payload,
    };

    // Generate JWT token
    const jwt = await new SignJWT(defaultPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expirationTime)
      .sign(secretKey);

    console.log("\n🎫 Generated JWT Token:");
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );
    console.log(jwt);
    console.log(
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    );

    console.log("\n📋 Token Details:");
    console.log(`Payload: ${JSON.stringify(defaultPayload, null, 2)}`);
    console.log(`Expires: ${expirationTime}`);
    console.log(
      `Secret: ${
        secret === "default-secret-key"
          ? "default-secret-key (⚠️  default)"
          : "[hidden]"
      }`
    );

    console.log("\n🚀 Usage Examples:");
    console.log(
      'curl -H "Authorization: Bearer ' +
        jwt +
        '" http://localhost:3000/register'
    );
    console.log(
      'curl -H "authorization: ' + jwt + '" http://localhost:3000/register'
    );

    return jwt;
  } catch (error) {
    console.error("❌ Error generating JWT:", error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
let payload = {};
let expirationTime = "1h";

if (args.length > 0) {
  try {
    payload = JSON.parse(args[0]);
  } catch (error) {
    console.error("❌ Invalid JSON payload:", args[0]);
    process.exit(1);
  }
}

if (args.length > 1) {
  expirationTime = args[1];
}

// Generate the JWT
generateJWT(payload, expirationTime);
