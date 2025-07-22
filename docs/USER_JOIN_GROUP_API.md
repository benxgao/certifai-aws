# User Join Group API

This endpoint allows adding a user to a MailerLite group by providing their email address and the group name.

## Endpoint

```
POST /join-group
```

## Authentication

Requires a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

## Request Body

```json
{
  "email": "user@example.com",
  "groupName": "Premium Members"
}
```

### Parameters

| Field       | Type   | Required | Description                                  |
| ----------- | ------ | -------- | -------------------------------------------- |
| `email`     | string | Yes      | Valid email address of the subscriber        |
| `groupName` | string | Yes      | Name of the group to join (1-100 characters) |

## Response

### Success Response (200)

When the user is successfully added to the group:

```json
{
  "success": true,
  "message": "Successfully added user user@example.com to group 'Premium Members'",
  "subscriberId": "123456",
  "groupId": "789012"
}
```

When the user is already in the group:

```json
{
  "success": true,
  "message": "User user@example.com is already in group 'Premium Members'"
}
```

### Error Responses

#### 400 Bad Request

- Invalid email format
- Missing required fields
- Invalid JSON format

```json
{
  "error": "Bad Request",
  "message": "Please provide a valid email address",
  "timestamp": "2025-07-23T10:30:00.000Z"
}
```

#### 401 Unauthorized

- Missing or invalid JWT token

```json
{
  "error": "Unauthorized",
  "message": "Authentication token is required",
  "timestamp": "2025-07-23T10:30:00.000Z"
}
```

#### 404 Not Found

- Subscriber not found in MailerLite
- Group not found in MailerLite

```json
{
  "error": "Not Found",
  "message": "Subscriber with email user@example.com not found",
  "timestamp": "2025-07-23T10:30:00.000Z"
}
```

#### 500 Internal Server Error

- MailerLite API configuration issues
- Rate limiting
- Unexpected errors

```json
{
  "error": "Internal Server Error",
  "message": "Service temporarily unavailable. Please try again later.",
  "timestamp": "2025-07-23T10:30:00.000Z"
}
```

## Implementation Details

### Workflow

1. **Authentication**: Validates JWT token from Authorization header
2. **Input Validation**: Validates email format and group name
3. **Subscriber Lookup**: Finds subscriber in MailerLite by email
4. **Group Lookup**: Finds group in MailerLite by name (case-insensitive)
5. **Group Assignment**: Calls MailerLite API to add subscriber to group

### MailerLite API Call

The endpoint calls the MailerLite API:

```
POST https://connect.mailerlite.com/api/subscribers/{subscriber_id}/groups/{group_id}
```

### Error Handling

- Gracefully handles subscriber already in group scenario
- Provides user-friendly error messages
- Logs all operations for debugging
- Handles MailerLite rate limiting

## Example Usage

### Using curl

```bash
curl -X POST https://api.certifai.io/join-group \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "groupName": "Premium Members"
  }'
```

### Using JavaScript/Fetch

```javascript
const response = await fetch("https://api.certifai.io/join-group", {
  method: "POST",
  headers: {
    Authorization: "Bearer your-jwt-token",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "john.doe@example.com",
    groupName: "Premium Members",
  }),
});

const result = await response.json();
console.log(result);
```
