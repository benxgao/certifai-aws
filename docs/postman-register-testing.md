# Testing the /register Endpoint with Postman

This guide provides step-by-step instructions for testing the user registration endpoint using Postman, including sample payloads and expected responses.

## Endpoint Details

- **URL**: `POST /register`
- **Method**: POST
- **Content-Type**: application/json
- **Function**: Registers a new user with MailerLite service

## Prerequisites

1. The SAM application must be deployed or running locally
2. MailerLite API key must be configured in environment variables
3. Postman application installed

## Base URLs

### Local Development

```
http://127.0.0.1:3000/register
```

### Deployed Environment

```
https://{api-gateway-id}.execute-api.{region}.amazonaws.com/{stage}/register
```

_Replace `{api-gateway-id}`, `{region}`, and `{stage}` with your actual deployment values_

## Request Structure

### Required Fields

- `email` (string): Valid email address

### Optional Fields

- `firstName` (string): User's first name (1-50 characters)
- `lastName` (string): User's last name (1-50 characters)
- `fields` (object): Additional custom fields as key-value pairs
- `groups` (array): Array of group names to assign the user

## Sample Payloads

### 1. Minimal Registration (Email Only)

```json
{
  "email": "john.doe@example.com"
}
```

### 2. Basic Registration with Names

```json
{
  "email": "jane.smith@example.com",
  "firstName": "Jane",
  "lastName": "Smith"
}
```

### 3. Complete Registration with Custom Fields and Groups

```json
{
  "email": "alice.johnson@example.com",
  "firstName": "Alice",
  "lastName": "Johnson",
  "fields": {
    "company": "TechCorp Inc",
    "job_title": "Software Engineer",
    "age": 28,
    "interest": "AI/ML"
  },
  "groups": ["newsletter", "tech-updates", "premium-users"]
}
```

### 4. Registration with Custom Fields Only

```json
{
  "email": "developer@startup.com",
  "fields": {
    "source": "website",
    "campaign": "spring2025",
    "budget": 50000
  }
}
```

## Postman Setup Instructions

### 1. Create a New Request

1. Open Postman
2. Click "New" → "Request"
3. Name your request: "User Registration"
4. Create or select a collection to save it

### 2. Configure the Request

1. **Method**: Select `POST`
2. **URL**: Enter the appropriate base URL + `/register`
3. **Headers**:
   - Key: `Content-Type`
   - Value: `application/json`

### 3. Set Request Body

1. Go to the "Body" tab
2. Select "raw"
3. Choose "JSON" from the dropdown
4. Paste one of the sample payloads above

### 4. Send the Request

Click the "Send" button to execute the request

## Expected Responses

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "User registered successfully",
  "subscriberId": "12345678"
}
```

### Validation Error (400 Bad Request)

```json
{
  "error": "Please provide a valid email address"
}
```

### Missing Body Error (400 Bad Request)

```json
{
  "error": "Request body is required"
}
```

### Invalid JSON Error (400 Bad Request)

```json
{
  "error": "Invalid JSON format"
}
```

### Server Error (500 Internal Server Error)

```json
{
  "error": "Service configuration error"
}
```

### MailerLite Integration Error (400 Bad Request)

```json
{
  "error": "Failed to register user with MailerLite"
}
```

## Testing Scenarios

### 1. Valid Registration Test

- **Payload**: Use sample payload #2 (Basic Registration)
- **Expected**: 200 OK with success response
- **Verification**: Check MailerLite dashboard for new subscriber

### 2. Invalid Email Test

```json
{
  "email": "invalid-email",
  "firstName": "Test"
}
```

- **Expected**: 400 Bad Request with validation error

### 3. Missing Email Test

```json
{
  "firstName": "Test",
  "lastName": "User"
}
```

- **Expected**: 400 Bad Request with "Email is required" error

### 4. Empty Body Test

- **Payload**: Send request with empty body
- **Expected**: 400 Bad Request with "Request body is required"

### 5. Invalid JSON Test

- **Payload**: Send malformed JSON (e.g., missing quotes)
- **Expected**: 400 Bad Request with "Invalid JSON format"

### 6. Long Name Test

```json
{
  "email": "test@example.com",
  "firstName": "ThisIsAReallyLongFirstNameThatExceedsFiftyCharactersLimit",
  "lastName": "ValidLastName"
}
```

- **Expected**: 400 Bad Request with validation error

## Environment Variables for Testing

If testing locally, ensure these environment variables are set:

```bash
export MAILERLITE_API_KEY="your_mailerlite_api_key_here"
export NODE_ENV="development"
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure SAM local API is running (`sam local start-api`)
2. **500 Error**: Check MailerLite API key configuration
3. **CORS Issues**: If testing from browser, ensure CORS is properly configured
4. **404 Error**: Verify the endpoint URL and deployment status

### Debug Tips

1. Check CloudWatch logs for detailed error messages
2. Use Postman's console to view request/response details
3. Verify MailerLite API key has proper permissions
4. Test with minimal payload first, then add complexity

## Collection Export

You can create a Postman collection with all these test cases and export it for team sharing. Include environment variables for different deployment stages (dev, staging, prod).

## Related Documentation

- [MailerLite API Documentation](https://developers.mailerlite.com/)
- [AWS SAM Local Testing](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-using-start-api.html)
- [Project Setup Guide](../README.md)
