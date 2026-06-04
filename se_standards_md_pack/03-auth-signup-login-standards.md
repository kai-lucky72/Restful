# Authentication, Signup & Login Standards

## 1. Signup Requirements

A proper signup flow should include:

- Full name
- Email address or phone number
- Strong password
- Confirm password
- Terms and privacy policy acceptance
- Optional profile photo after account creation
- Email or phone verification if required

## 2. Signup Validation

Validate:
- Name is not empty
- Email format is valid
- Email is not already used
- Phone number is valid if used
- Password is strong
- Confirm password matches
- User accepted terms

## 3. Signup Success Response

```json
{
  "success": true,
  "message": "Account created successfully. Please verify your email or phone number.",
  "data": {
    "userId": "123",
    "verificationRequired": true
  }
}
```

## 4. Signup Error Examples

Duplicate email:

```json
{
  "success": false,
  "message": "An account with this email already exists.",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

Weak password:

```json
{
  "success": false,
  "message": "Password must contain uppercase, lowercase, number, and special character.",
  "code": "WEAK_PASSWORD"
}
```

## 5. Password Standards

Minimum recommended password rules:
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

Never store plain text passwords.

Passwords must be hashed using a secure password hashing algorithm.

## 6. Login Requirements

Login should include:
- Email/phone
- Password
- Optional remember me
- Optional OTP or two-factor authentication

## 7. Failed Login Protection

Protect accounts by:
- Limiting failed login attempts
- Temporarily locking accounts after too many attempts
- Sending alert emails for suspicious login attempts
- Not revealing whether email exists

Bad:
> This email exists but the password is wrong.

Good:
> Email or password is incorrect.

## 8. OTP Standards

OTP should:
- Expire after a short time, usually 5–10 minutes
- Be usable only once
- Have maximum attempts, usually 3–5
- Be rate-limited
- Be stored securely, preferably hashed

## 9. Password Reset Flow

Steps:
1. User requests password reset.
2. System sends OTP or secure reset link.
3. User verifies OTP/link.
4. User sets a new password.
5. System invalidates old sessions if needed.
6. System sends confirmation email/SMS.

## 10. Logout Standards

Logout should:
- Invalidate refresh token if used
- Clear authentication cookies
- Clear frontend auth state
- Redirect user safely

## 11. Session & Token Standards

Access tokens should be short-lived.
Refresh tokens should be longer-lived and protected.

Recommended:
- Access token: 15 minutes to 1 day depending on project risk
- Refresh token: 7 to 30 days

## 12. Account Verification

If verification is required:
- User should not access sensitive features before verification.
- Verification links or OTPs must expire.
- Resend verification must be rate-limited.

## 13. Auth Logs

Log:
- Successful login
- Failed login
- Password reset request
- Password changed
- OTP requested
- OTP failed
- Account locked
- Account deleted

Do not log passwords or OTP codes.
