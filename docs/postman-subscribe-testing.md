# Testing the /subscribe Endpoint with Postman

This guide provides step-by-step instructions for testing the user subscription endpoint using Postman, including sample payloads and expected responses.

## Endpoint Details

- **URL**: `POST /subscribe`
- **Method**: POST
- **Content-Type**: application/json
- **Authentication**: Bearer Token (JWT)
- **Function**: Subscribes a new user with MailerLite service

## Prerequisites

1. The SAM application must be deployed or running locally
2. MailerLite API key must be configured in environment variables
3. JWT secret must be configured for token validation
4. Valid JWT token for authentication
5. Postman application installed

## Base URLs

### Local Development

```
http://localhost:3000/subscribe
```

### Deployed (AWS)

```
https://your-api-gateway-id.execute-api.region.amazonaws.com/stage/subscribe
```

## Authentication Setup

1. **Generate JWT Token**: Use the provided script to generate a valid JWT token:

   ```bash
   node scripts/generate-jwt.js
   ```

2. **Add Authorization Header**: In Postman, add the following header:
   - **Key**: `Authorization`
   - **Value**: `Bearer YOUR_JWT_TOKEN_HERE`

## Sample Payloads

### 1. Minimal Subscription (Email Only)

```json
{
  "email": "user@example.com"
}
```

### 2. Basic Subscription with Names

```json
{
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

### 3. Complete Subscription with Custom Fields and Groups

```json
{
  "email": "jane.smith@company.com",
  "firstName": "Jane",
  "lastName": "Smith",
  "fields": {
    "company": "Tech Corp",
    "job_title": "Software Engineer",
    "phone": "+1234567890"
  },
  "groups": ["newsletter", "product_updates"],
  "status": "active",
  "subscribed_at": "2025-07-03T10:30:00Z",
  "ip_address": "192.168.1.100"
}
```

### 4. Subscription with Custom Fields Only

```json
{
  "email": "developer@startup.com",
  "fields": {
    "company": "StartupXYZ",
    "industry": "Technology",
    "country": "USA",
    "annual_revenue": 1000000
  },
  "groups": ["developers", "enterprise"]
}
```

### 5. Subscription with Groups and Status

```json
{
  "email": "marketing@business.com",
  "firstName": "Marketing",
  "lastName": "Team",
  "groups": ["marketing_team", "announcements"],
  "status": "unconfirmed"
}
```

## Setting up Postman Request

1. **Create New Request**: Click "New" → "Request"
2. **Set Method**: Change from GET to POST
3. **Name your request**: "User Subscription"
4. **Enter URL**:

   - Local: `http://localhost:3000/subscribe`
   - Deployed: `https://your-api-id.execute-api.region.amazonaws.com/stage/subscribe`

5. **Headers Tab**:

   - Add `Content-Type: application/json`
   - Add `Authorization: Bearer YOUR_JWT_TOKEN`

6. **Body Tab**:
   - Select "raw"
   - Choose "JSON" from dropdown
   - Paste one of the sample payloads above

## Expected Responses

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "User subscribed successfully",
  "subscriberId": "12345678"
}
```

### Validation Error (400 Bad Request)

```json
{
  "message": "Please provide a valid email address"
}
```

### Authentication Error (401 Unauthorized)

```json
{
  "message": "Authentication token is required"
}
```

### MailerLite API Error (400 Bad Request)

```json
{
  "message": "Invalid data provided or subscriber already exists"
}
```

### Server Error (500 Internal Server Error)

```json
{
  "message": "Service configuration error"
}
```

## Testing Scenarios

### 1. Successful Subscription

- Use a valid email with proper JWT token
- Expected: 200 OK with subscriber ID

### 2. Missing Authentication

- Send request without Authorization header
- Expected: 401 Unauthorized

### 3. Invalid JWT Token

- Use an expired or malformed token
- Expected: 401 Unauthorized

### 4. Invalid Email Format

```json
{
  "email": "not-an-email"
}
```

- Expected: 400 Bad Request

### 5. Missing Required Field

```json
{
  "firstName": "John",
  "lastName": "Doe"
}
```

- Expected: 400 Bad Request (Email is required)

### 6. Invalid JSON Format

- Send malformed JSON
- Expected: 400 Bad Request

### 7. Empty Request Body

- Send empty body or null
- Expected: 400 Bad Request

### 8. Large Custom Fields Object

```json
{
  "email": "test@example.com",
  "fields": {
    "field1": "value1",
    "field2": "value2",
    "field3": "value3",
    "field4": "value4",
    "field5": "value5"
  }
}
```

- Expected: 200 OK (should handle multiple custom fields)

### 9. Multiple Groups

```json
{
  "email": "test@example.com",
  "groups": ["group1", "group2", "group3", "group4"]
}
```

- Expected: 200 OK (should handle multiple groups)

### 10. Special Characters in Fields

```json
{
  "email": "test@example.com",
  "firstName": "José",
  "lastName": "García-López",
  "fields": {
    "company": "Café & Co.",
    "notes": "Special chars: áéíóú ñ ç"
  }
}
```

- Expected: 200 OK (should handle Unicode characters)

## Collection Setup

To create a comprehensive Postman collection:

1. **Create Collection**: Name it "CertifAI User Subscription API"

2. **Environment Variables**:

   - `base_url`: `http://localhost:3000` (local) or your deployed URL
   - `jwt_token`: Your valid JWT token

3. **Pre-request Script** (Collection level):

   ```javascript
   // Auto-generate test email if not provided
   if (!pm.request.body || !pm.request.body.raw) {
     const timestamp = Date.now();
     const testEmail = `test${timestamp}@example.com`;
     pm.environment.set("test_email", testEmail);
   }
   ```

4. **Tests Script** (Collection level):

   ```javascript
   pm.test("Status code is 200", function () {
     pm.response.to.have.status(200);
   });

   pm.test("Response has success field", function () {
     const jsonData = pm.response.json();
     pm.expect(jsonData).to.have.property("success");
   });

   pm.test("Response has message field", function () {
     const jsonData = pm.response.json();
     pm.expect(jsonData).to.have.property("message");
   });
   ```

## Environment Variables

Create environments for different stages:

### Local Development

- `base_url`: `http://localhost:3000`
- `jwt_token`: `your_local_jwt_token`

### Staging

- `base_url`: `https://your-staging-api.execute-api.region.amazonaws.com/staging`
- `jwt_token`: `your_staging_jwt_token`

### Production

- `base_url`: `https://your-prod-api.execute-api.region.amazonaws.com/prod`
- `jwt_token`: `your_production_jwt_token`

## Troubleshooting

### Common Issues

1. **"Authentication token is required"**

   - Ensure Authorization header is set with Bearer token

2. **"Invalid authentication token"**

   - Generate a new JWT token using the script
   - Check that JWT secret matches server configuration

3. **"Service configuration error"**

   - Verify MailerLite API key is configured
   - Check environment variables

4. **Connection refused**

   - Ensure the local server is running (`npm run dev`)
   - Check the correct port (3000 by default)

5. **CORS errors** (when testing from browser)
   - Use Postman desktop app instead of web version
   - Ensure CORS is properly configured in template.yaml

### Debug Steps

1. **Check Server Logs**: Monitor CloudWatch logs (deployed) or terminal output (local)
2. **Validate JWT**: Use online JWT decoders to verify token structure
3. **Test Health Endpoint**: First ensure `/health` endpoint responds
4. **Verify Environment**: Check all required environment variables are set
