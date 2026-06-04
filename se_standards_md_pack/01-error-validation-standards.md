# Error & Validation Standards

## 1. General Rule

Every input from a user, admin, frontend, mobile app, API client, or external service must be validated before processing.

Never trust user input.

## 2. Validation Should Happen In Two Places

### Frontend Validation
Used for better user experience.

Examples:
- Required fields
- Email format
- Password length
- Phone number format
- File size warning
- Empty field warnings

### Backend Validation
Used for real security and data protection.

Examples:
- Required fields
- Data type checks
- Unique email checks
- Role permission checks
- File type validation
- SQL/NoSQL injection protection
- Business rule validation

Backend validation is mandatory even if frontend validation exists.

## 3. Standard API Error Response Format

Use one consistent structure for all errors.

```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## 4. Standard API Success Response Format

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

## 5. Common HTTP Status Codes

| Status | Meaning | Use Case |
|---|---|---|
| 200 | OK | Successful fetch/update |
| 201 | Created | New resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | User not logged in |
| 403 | Forbidden | User has no permission |
| 404 | Not Found | Resource does not exist |
| 409 | Conflict | Duplicate email, already exists |
| 422 | Unprocessable Entity | Business validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Server Error | Unexpected backend issue |

## 6. Validation Examples

### Signup
Validate:
- Full name is required
- Email is required and valid
- Email is unique
- Phone number format is valid
- Password has minimum length
- Password contains uppercase, lowercase, number, and special character
- Password confirmation matches
- Terms and privacy policy accepted

### Login
Validate:
- Email or phone is required
- Password is required
- Account is not locked
- Account is verified if verification is required
- Too many failed attempts are blocked temporarily

### File Upload
Validate:
- File exists
- File type is allowed
- File size is not too large
- File name is sanitized
- File does not overwrite existing files unexpectedly

## 7. Error Message Rules

Good error messages should be:
- Clear
- Short
- Human-friendly
- Safe
- Actionable

Bad:
> Invalid credentials for user john@example.com, password hash mismatch.

Good:
> Email or password is incorrect.

Bad:
> SQL error near table users.

Good:
> Something went wrong. Please try again later.

## 8. Do Not Expose Sensitive Internal Details

Never expose:
- Stack traces
- Database errors
- File paths
- Server IP addresses
- Secret keys
- Password hashes
- Token values

## 9. Business Rule Validation

Validation is not only about data format. It also includes business logic.

Examples:
- User cannot book a parking space that is already occupied.
- User cannot pay an invoice that is already paid.
- Admin cannot delete the last super admin.
- User cannot delete another user’s data.
- Expired OTP cannot be used.

## 10. Rate Limiting

Add rate limits for:
- Login
- Signup
- OTP request
- Password reset
- Payment callback endpoints
- Contact forms
- Search endpoints

Example:
- Maximum 5 login attempts per 15 minutes.
- Maximum 3 OTP requests per 10 minutes.

## 11. Empty State Handling

Every list page should handle empty data.

Examples:
- “No users found.”
- “No payments have been made yet.”
- “No logs available for this period.”

## 12. Frontend Form Rules

Every form should include:
- Required field indicators
- Inline validation messages
- Disabled submit button while processing
- Loading state
- Success message
- Error message
- Clear reset behavior after success where needed

## 13. Logging Errors

Every unexpected backend error should be logged with:
- Timestamp
- Request ID
- User ID if available
- Endpoint
- Error message
- Stack trace internally only
- IP address if allowed by policy

Never show internal logs to normal users.
