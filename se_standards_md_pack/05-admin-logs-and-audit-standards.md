# Admin Logs & Audit Standards

## 1. Purpose

Admin logs and audit trails help the system owner understand what happened, who did it, and when it happened.

They are important for:
- Security
- Accountability
- Debugging
- Compliance
- Fraud investigation
- System monitoring

## 2. Events That Must Be Logged

### Authentication Logs
- Login success
- Login failure
- Logout
- Password reset request
- Password changed
- OTP requested
- OTP failed
- Account locked

### User Account Logs
- Account created
- Account updated
- Account deleted
- Email changed
- Phone changed
- Role changed
- User blocked/unblocked

### Admin Logs
- Admin created user
- Admin updated user
- Admin deleted user
- Admin changed role/permission
- Admin exported data
- Admin viewed sensitive record

### Payment Logs
- Payment initiated
- Payment successful
- Payment failed
- Refund initiated
- Invoice generated
- Invoice cancelled

### Data Logs
- Record created
- Record updated
- Record deleted
- File uploaded
- File deleted
- Data exported

## 3. Standard Log Fields

Each log should include:

```json
{
  "timestamp": "2026-06-01T10:00:00Z",
  "actorId": "admin_123",
  "actorRole": "ADMIN",
  "action": "USER_ROLE_UPDATED",
  "targetType": "USER",
  "targetId": "user_456",
  "oldValue": {
    "role": "USER"
  },
  "newValue": {
    "role": "ADMIN"
  },
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0",
  "status": "SUCCESS",
  "requestId": "req_789"
}
```

## 4. Log Message Examples

Good:

> Admin Jane changed user John’s role from USER to ADMIN.

Bad:

> Update successful.

## 5. Sensitive Data In Logs

Never log:
- Passwords
- OTP codes
- Full tokens
- Full card numbers
- Secret keys
- Private keys

Mask sensitive values:

```text
email: jo***@example.com
phone: +25078****123
card: **** **** **** 4242
```

## 6. Audit Trail Rules

Audit logs should be:
- Immutable where possible
- Searchable
- Filterable by date, user, action, and role
- Protected from normal users
- Exportable only by authorized admins

## 7. Admin Logs Dashboard

Admin dashboard should include:
- Recent activities
- Failed login attempts
- Critical actions
- Payment errors
- System errors
- Suspicious behavior alerts

## 8. Request ID Rule

Every API request should have a unique request ID.

This helps developers trace an issue from frontend to backend logs.

Example:

```text
Request ID: req_01ABCDEF
```

## 9. Error Monitoring

Production systems should monitor:
- 500 errors
- Failed jobs
- Payment callback failures
- Email sending failures
- High login failure rates
- High OTP request rates

## 10. Log Retention

Define how long logs are stored.

Example:
- Security logs: 1 year
- Payment logs: 5 years depending on rules
- Debug logs: 30 days
- Audit logs: long-term storage

## 11. Admin Permission Rules

Not every admin should access everything.

Use role-based access control:
- Super Admin
- Admin
- Support Agent
- Finance Admin
- Viewer

Each role should have limited permissions.
