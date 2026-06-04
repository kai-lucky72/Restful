# Critical User Actions Standards

## 1. Purpose

Critical actions can affect user data, money, access, security, or system integrity.

These actions must always be handled carefully.

## 2. Examples Of Critical Actions

- Delete account
- Delete user data
- Delete payment method
- Change password
- Change email or phone number
- Transfer money
- Pay invoice
- Cancel subscription
- Remove admin
- Change user role
- Delete organization/project
- Export sensitive data
- Disable security settings

## 3. Confirmation Rule

Every critical action must ask for confirmation before execution.

Basic confirmation:

> Are you sure you want to continue?

Better confirmation:

> This action will permanently delete your account and all related data. This cannot be undone. Are you sure you want to continue?

## 4. Delete Account Flow

Recommended flow:

1. User clicks “Delete Account”.
2. Show warning page/modal.
3. Explain what will happen.
4. Ask user to confirm password or OTP.
5. Ask user to type a confirmation phrase like `DELETE`.
6. Process deletion or schedule deletion.
7. Send confirmation email/SMS.
8. Log the action.

## 5. Delete Account Warning Example

```text
Deleting your account will permanently remove your profile, settings, saved data, and account access.
Some records may be kept if required for legal, security, or financial reasons.
This action cannot be undone.

Type DELETE to confirm.
```

## 6. Data Deletion Notice

Before deleting data, tell the user:
- What data will be deleted
- What data may remain
- Whether deletion is permanent
- Whether the user can recover it
- How long deletion may take

## 7. Soft Delete vs Hard Delete

### Soft Delete
Data is marked as deleted but remains in the database.

Use for:
- Account recovery
- Audit logs
- Legal compliance
- Mistake prevention

### Hard Delete
Data is permanently removed.

Use only when:
- The user has the right to deletion
- The data is not required for legal/security reasons
- System integrity will not break

## 8. Update Profile Flow

When updating important profile data:
- Validate new data
- Confirm changes if sensitive
- Ask for password/OTP for email or phone change
- Send notification after change
- Keep audit log

Example message:

> Your email address was changed successfully. If this was not you, please contact support immediately.

## 9. Change Password Flow

Require:
- Current password
- New password
- Confirm new password
- Strong password validation
- Logout from other devices option
- Confirmation notification

## 10. Payment Confirmation Flow

Before payment:
- Show amount
- Currency
- Fees if any
- Payment method
- Service/product name
- Refund policy if relevant

Example:

> You are about to pay 5,000 RWF for Parking Ticket #12345. Please confirm to continue.

## 11. Admin Critical Actions

For admin actions such as deleting users or changing roles:
- Require admin authentication
- Require role permission
- Ask for confirmation
- Log the action
- Store old value and new value
- Notify affected user if appropriate

## 12. Undo Option

For non-dangerous actions, provide undo.

Examples:
- Archive message
- Remove item from cart
- Hide record

For dangerous actions, use confirmation instead of simple undo.

## 13. Critical Action Logs

Log:
- Who performed the action
- What action was performed
- Target resource
- Old value
- New value
- Timestamp
- IP address if allowed
- Device/user agent if allowed
- Success/failure status
