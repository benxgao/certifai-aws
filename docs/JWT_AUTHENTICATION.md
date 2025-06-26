# JWT Authentication for /register Endpoint

This document explains the JWT authentication implementation for the `/register` endpoint using the `jose` library and `PUBLIC_JWT_SECRET` environment variable.

## Overview

The `/register` endpoint is now protected with JWT (JSON Web Token) authentication. All requests to this endpoint must include a valid JWT token in the Authorization header.

## Authentication Flow

1. **Token Required**: Every request to `/register` must include a JWT token
2. **Token Extraction**: Token is extracted from the `Authorization` header
3. **Token Verification**: Token is verified using the `PUBLIC_JWT_SECRET` environment variable
4. **Access Control**: Only requests with valid tokens can proceed to user registration

## Implementation Details

### JWT Utility Functions

Located in `src/utils/jwtAuth.ts`:

- `verifyJwtToken(token: string)`: Verifies JWT token using PUBLIC_JWT_SECRET
- `extractTokenFromHeader(authHeader: string)`: Extracts token from Authorization header

### Environment Variable

- `PUBLIC_JWT_SECRET`: The secret key used to sign and verify JWT tokens
- Must be set in your CloudFormation parameters or environment

### Token Formats Supported

The authentication supports multiple token formats:

```bash
# Bearer token format (recommended)
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Direct token format
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Case insensitive
authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Usage Examples

### Generating a JWT Token

Use the provided script to generate test tokens:

```bash
# Using default payload and 1 hour expiration
PUBLIC_JWT_SECRET=your-secret-key node scripts/generate-jwt.js

# Custom payload
PUBLIC_JWT_SECRET=your-secret-key node scripts/generate-jwt.js '{"userId":"123","role":"admin"}' '24h'

# Different expiration times
PUBLIC_JWT_SECRET=your-secret-key node scripts/generate-jwt.js '{}' '30m'
PUBLIC_JWT_SECRET=your-secret-key node scripts/generate-jwt.js '{}' '7d'
```

### Making Authenticated Requests

```bash
# Local development
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"John","lastName":"Doe"}' \
  http://localhost:3000/register

# AWS API Gateway
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"John","lastName":"Doe"}' \
  https://your-api-id.execute-api.region.amazonaws.com/dev/register
```

### Testing with Postman

1. Set the request method to `POST`
2. Set the URL to your API endpoint + `/register`
3. In Headers tab, add:
   - `Authorization`: `Bearer YOUR_JWT_TOKEN`
   - `Content-Type`: `application/json`
4. In Body tab, select `raw` and `JSON`, then add:
   ```json
   {
     "email": "test@example.com",
     "firstName": "John",
     "lastName": "Doe"
   }
   ```

## Response Codes

### Success (200)

```json
{
  "success": true,
  "message": "User registered successfully",
  "subscriberId": "12345"
}
```

### Authentication Errors (401)

**Missing Token:**

```json
{
  "error": "Unauthorized",
  "message": "Authentication token is required",
  "timestamp": "2025-06-27T10:30:00.000Z"
}
```

**Invalid Token:**

```json
{
  "error": "Unauthorized",
  "message": "Invalid authentication token",
  "timestamp": "2025-06-27T10:30:00.000Z"
}
```

### Validation Errors (400)

**Missing Request Body:**

```json
{
  "error": "Bad Request",
  "message": "Request body is required",
  "timestamp": "2025-06-27T10:30:00.000Z"
}
```

**Invalid JSON:**

```json
{
  "error": "Bad Request",
  "message": "Invalid JSON format",
  "timestamp": "2025-06-27T10:30:00.000Z"
}
```

## Deployment Configuration

### CloudFormation Parameters

The `template.yaml` includes a new parameter for the JWT secret:

```yaml
Parameters:
  PublicJwtSecret:
    Type: String
    NoEcho: true
    Description: JWT Secret for public token authentication
```

### Environment Variables

The Lambda function receives the JWT secret via environment variable:

```yaml
Environment:
  Variables:
    PUBLIC_JWT_SECRET: !Ref PublicJwtSecret
```

### Deployment Commands

```bash
# Build the application
sam build

# Deploy with guided setup (first time)
sam deploy --guided

# Deploy with parameters
sam deploy --parameter-overrides \
  MailerLiteApiKey=your-mailerlite-key \
  PublicJwtSecret=your-jwt-secret
```

## Security Considerations

1. **Secret Management**: Store `PUBLIC_JWT_SECRET` securely (AWS Secrets Manager, Parameter Store)
2. **Token Expiration**: Use reasonable expiration times (1h-24h recommended)
3. **Secret Rotation**: Regularly rotate the JWT secret
4. **HTTPS Only**: Always use HTTPS in production
5. **Token Storage**: Avoid storing tokens in localStorage; use secure httpOnly cookies if possible

## Testing

### Unit Tests

The implementation includes comprehensive tests:

- `src/handlers/__tests__/userRegistration-jwt.test.ts`: Tests JWT protection in the handler
- `src/utils/__tests__/jwtAuth.test.ts`: Tests JWT utility functions

Run tests:

```bash
npm test
```

### Integration Testing

Test the complete flow:

1. Generate a valid JWT token
2. Make request to `/register` with token
3. Verify successful registration
4. Test with invalid/missing tokens
5. Verify proper error responses

## Troubleshooting

### Common Issues

1. **"PUBLIC_JWT_SECRET environment variable is not set"**

   - Ensure the CloudFormation parameter is set during deployment
   - Check Lambda environment variables in AWS Console

2. **"Invalid authentication token"**

   - Verify token was generated with the same secret
   - Check token hasn't expired
   - Ensure correct token format in Authorization header

3. **"Authentication token is required"**
   - Check Authorization header is present
   - Verify header name spelling (case-insensitive)

### Debug Steps

1. Check Lambda logs in CloudWatch
2. Verify environment variables are set
3. Test token generation locally
4. Use the provided test scripts
5. Check API Gateway request/response logs

## Migration from Unprotected Endpoint

If migrating from an unprotected `/register` endpoint:

1. Deploy the new version with JWT protection
2. Update all client applications to include JWT tokens
3. Test thoroughly in staging environment
4. Monitor error rates after deployment
5. Have rollback plan ready if needed
