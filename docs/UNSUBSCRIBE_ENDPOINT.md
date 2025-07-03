# User Unsubscribe Endpoint

## Overview

The `/unsubscribe/{id}` endpoint allows you to unsubscribe users from MailerLite by updating their subscription status to "unsubscribed" and setting the unsubscribed_at timestamp.

## Endpoint Details

- **Method**: PUT
- **Path**: `/unsubscribe/{id}`
- **Authentication**: JWT Bearer token required

## Path Parameters

- `id` (required): The MailerLite subscriber ID

## Headers

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## Request

No request body is required. The subscriber ID is passed as a path parameter.

```
PUT /unsubscribe/12345
Authorization: Bearer your-jwt-token
```

## Response

### Success Response (200)

```json
{
  "success": true,
  "message": "User unsubscribed successfully",
  "subscriberId": "12345"
}
```

### Error Responses

#### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "Authentication token is required",
  "timestamp": "2025-07-03T03:42:06.216Z"
}
```

#### 400 Bad Request

```json
{
  "error": "Bad Request",
  "message": "Subscriber ID is required",
  "timestamp": "2025-07-03T03:42:06.216Z"
}
```

#### 404 Not Found

```json
{
  "error": "Not Found",
  "message": "Subscriber not found",
  "timestamp": "2025-07-03T03:42:06.216Z"
}
```

#### 500 Internal Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Service configuration error",
  "timestamp": "2025-07-03T03:42:06.216Z"
}
```

## MailerLite Integration

The endpoint sends a PUT request to `https://connect.mailerlite.com/api/subscribers/{id}` with the following payload:

```json
{
  "status": "unsubscribed",
  "unsubscribed_at": "2025-07-03 03:42:06"
}
```

## Testing

Run the test suite for the unsubscribe handler:

```bash
npm test -- --testPathPatterns=userUnsubscribe
```

## Environment Variables

Ensure the following environment variable is configured:

- `MAILERLITE_API_KEY`: Your MailerLite API key
- `MARKETING_API_JWT_SECRET`: JWT secret for token verification

## Deployment

The endpoint is automatically deployed when you run:

```bash
sam build
sam deploy
```

The function is defined in the SAM template as `UserUnsubscribeFunction` and is mapped to the `/unsubscribe/{id}` path with PUT method.
