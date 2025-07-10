# Group Name to ID Conversion

The `/subscribe` endpoint now supports automatic conversion of group names to group IDs when subscribing users to MailerLite.

## How it works

When you send a request to the `/subscribe` endpoint with group names in the `groups` array, the system will:

1. Detect if the groups array contains names (non-numeric strings)
2. Fetch all available groups from MailerLite API (`GET https://connect.mailerlite.com/api/groups`)
3. Convert group names to their corresponding IDs
4. Create the subscriber with the converted group IDs

## Examples

### Using Group Names

```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "groups": ["Newsletter", "VIP Members", "Weekly Updates"]
}
```

This will be automatically converted to:

```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "groups": ["123", "456", "789"]
}
```

### Using Group IDs (existing behavior)

```json
{
  "email": "user@example.com",
  "groups": ["123", "456", "789"]
}
```

This will work as before - no conversion needed.

### Mixed Group Names and IDs

```json
{
  "email": "user@example.com",
  "groups": ["Newsletter", "456", "Weekly Updates"]
}
```

This will be converted to:

```json
{
  "email": "user@example.com",
  "groups": ["123", "456", "789"]
}
```

## Features

- **Case-insensitive matching**: Group names are matched case-insensitively
- **Error handling**: If a group name is not found, the API will return an error with details
- **Mixed support**: Can handle arrays with both group names and group IDs
- **Backward compatibility**: Existing requests with group IDs continue to work unchanged

## Error Scenarios

### Group Not Found

If you specify a group name that doesn't exist in MailerLite:

Request:

```json
{
  "email": "user@example.com",
  "groups": ["Newsletter", "Non-existent Group"]
}
```

Response:

```json
{
  "statusCode": 400,
  "body": "Groups not found: Non-existent Group"
}
```

### MailerLite API Errors

If there's an issue fetching groups from MailerLite (e.g., invalid API key, rate limiting), the error will be propagated with appropriate error messages.

## Implementation Details

The conversion logic is implemented in the `MailerLiteService` class with the following methods:

- `getGroups()`: Fetches all groups from MailerLite API
- `convertGroupNamesToIds()`: Converts an array of group names to group IDs
- `createSubscriber()`: Enhanced to detect and convert group names before creating the subscriber

The system automatically detects whether conversion is needed by checking if any items in the groups array are non-numeric strings.
