# Local Testing Examples

This file contains example requests for testing the API endpoints locally.

## Prerequisites

Start the local API server:

```bash
npm run local
```

The API will be available at: http://localhost:3000

## Health Check Examples

### Basic Health Check

```bash
curl -X GET http://localhost:3000/health
```

### Health Check with Headers

```bash
curl -X GET http://localhost:3000/health \
  -H "Accept: application/json" \
  -v
```

## User Subscription Examples

### Basic Subscription

```bash
curl -X POST http://localhost:3000/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test@example.com"
  }'
```

### Complete Subscription

```bash
curl -X POST http://localhost:3000/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "fields": {
      "company": "Example Corp",
      "phone": "+1234567890",
      "interests": "technology"
    },
    "groups": ["newsletter", "updates"]
  }'
```

### Invalid Email Test

```bash
curl -X POST http://localhost:3000/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "invalid-email"
  }'
```

### Missing Email Test

```bash
curl -X POST http://localhost:3000/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Empty Body Test

```bash
curl -X POST http://localhost:3000/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Invalid JSON Test

```bash
curl -X POST http://localhost:3000/subscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"email": "test@example.com"'
```

## Testing with Different Tools

### Using HTTPie (if installed)

```bash
# Health check
http GET localhost:3000/health

# User subscription
http POST localhost:3000/subscribe \
  Authorization:"Bearer YOUR_JWT_TOKEN" \
  email=test@example.com \
  firstName=John \
  lastName=Doe
```

### Using Postman

Import these requests into Postman:

**Health Check Request:**

- Method: GET
- URL: http://localhost:3000/health

**User Subscription Request:**

- Method: POST
- URL: http://localhost:3000/subscribe
- Headers:
  - Content-Type: application/json
  - Authorization: Bearer YOUR_JWT_TOKEN
- Body (raw JSON):

```json
{
  "email": "test@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fields": {
    "company": "Example Corp"
  }
}
```

## Expected Responses

### Health Check Success

```json
{
  "status": "healthy",
  "timestamp": "2023-06-19T10:00:00.000Z",
  "version": "1.0.0",
  "environment": "dev"
}
```

### Subscription Success

```json
{
  "success": true,
  "message": "User subscribed successfully",
  "subscriberId": "12345"
}
```

### Validation Error

```json
{
  "error": "Bad Request",
  "message": "Please provide a valid email address",
  "timestamp": "2023-06-19T10:00:00.000Z"
}
```

### Server Error

```json
{
  "error": "Internal Server Error",
  "message": "Service configuration error",
  "timestamp": "2023-06-19T10:00:00.000Z"
}
```

## Load Testing

### Using Apache Bench (ab)

```bash
# Test health endpoint
ab -n 100 -c 10 http://localhost:3000/health

# Test subscription endpoint
ab -n 50 -c 5 -p subscription.json -T application/json -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3000/subscribe
```

Create `subscription.json` file:

```json
{
  "email": "loadtest@example.com",
  "firstName": "Load",
  "lastName": "Test"
}
```

### Using wrk (if installed)

```bash
# Test health endpoint
wrk -t2 -c10 -d30s http://localhost:3000/health

# Test subscription endpoint with POST data
wrk -t2 -c5 -d30s -s post.lua http://localhost:3000/subscribe
```

Create `post.lua` file:

```lua
wrk.method = "POST"
wrk.body   = '{"email":"loadtest@example.com","firstName":"Load","lastName":"Test"}'
wrk.headers["Content-Type"] = "application/json"
wrk.headers["Authorization"] = "Bearer YOUR_JWT_TOKEN"
```

## Debugging Tips

1. **Check logs**: The local server will show detailed logs in the terminal
2. **Environment variables**: Make sure your `.env` file is configured
3. **MailerLite API**: Test with a valid API key for registration endpoints
4. **CORS issues**: If testing from a browser, make sure CORS headers are working
5. **JSON format**: Ensure request bodies are valid JSON

## Performance Monitoring

Monitor the local server performance by checking:

- Response times in curl output (`-w "@curl-format.txt"`)
- Memory usage (`ps aux | grep node`)
- Network connections (`netstat -an | grep 3000`)

Create `curl-format.txt`:

```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```
