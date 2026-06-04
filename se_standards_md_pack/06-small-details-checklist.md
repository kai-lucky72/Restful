# Small Details Software Engineers Often Miss

Use this checklist before submitting or deploying a project.

## 1. Forms

- [ ] Required fields are clearly marked.
- [ ] Empty fields show helpful errors.
- [ ] Submit button shows loading state.
- [ ] Submit button is disabled during request.
- [ ] Duplicate submissions are prevented.
- [ ] Success message is shown.
- [ ] Error message is shown.
- [ ] Inputs are trimmed before saving.
- [ ] Password fields can be shown/hidden.
- [ ] Long text does not break the layout.

## 2. Authentication

- [ ] Passwords are hashed.
- [ ] Login errors do not reveal whether email exists.
- [ ] Too many login attempts are blocked.
- [ ] OTP expires.
- [ ] OTP has max attempts.
- [ ] Password reset links expire.
- [ ] Logout clears tokens/cookies.
- [ ] Protected pages require authentication.
- [ ] Role-based pages require correct permission.

## 3. Signup

- [ ] Email/phone is unique.
- [ ] Password confirmation is checked.
- [ ] Terms/privacy acceptance is required.
- [ ] Verification is sent where needed.
- [ ] User receives clear next step after signup.

## 4. Delete & Critical Actions

- [ ] Delete account asks for confirmation.
- [ ] Dangerous actions explain consequences.
- [ ] User must type confirmation for permanent deletion.
- [ ] Password or OTP is required for sensitive actions.
- [ ] Admin critical actions are logged.
- [ ] Affected users are notified when necessary.

## 5. API Responses

- [ ] All success responses follow one format.
- [ ] All error responses follow one format.
- [ ] Correct HTTP status codes are used.
- [ ] API does not expose stack traces.
- [ ] API does not expose secrets.
- [ ] 404 cases are handled.
- [ ] 401 and 403 are handled separately.

## 6. Database

- [ ] Required fields are enforced.
- [ ] Unique constraints exist where needed.
- [ ] Foreign keys are handled correctly.
- [ ] Deleted records do not break related data.
- [ ] CreatedAt and updatedAt fields exist.
- [ ] Soft delete is considered for important data.
- [ ] Database errors are handled safely.

## 7. Environment & Secrets

- [ ] `.env` is in `.gitignore`.
- [ ] `.env.example` exists.
- [ ] No real secrets are committed.
- [ ] App checks required environment variables at startup.
- [ ] Production uses different credentials from development.
- [ ] Debug mode is disabled in production.

## 8. Admin Panel

- [ ] Admin actions require admin role.
- [ ] Admin logs show who did what.
- [ ] Logs are filterable.
- [ ] Admin cannot delete the last super admin.
- [ ] Sensitive data is masked.
- [ ] Export actions are logged.

## 9. Payments

- [ ] Amount is shown before payment.
- [ ] Currency is shown.
- [ ] Payment success is verified from provider, not only frontend.
- [ ] Duplicate payment callbacks are handled.
- [ ] Paid invoices cannot be paid again.
- [ ] Failed payments show clear messages.
- [ ] Receipts/invoices are generated.

## 10. Notifications

- [ ] User is notified after password change.
- [ ] User is notified after email/phone change.
- [ ] User is notified after account deletion.
- [ ] Admins are notified for critical system failures.
- [ ] Email/SMS failures are logged.

## 11. Security

- [ ] CORS is restricted in production.
- [ ] HTTPS is used in production.
- [ ] Cookies use secure settings.
- [ ] Inputs are sanitized.
- [ ] File uploads are validated.
- [ ] Rate limiting is enabled.
- [ ] Sensitive routes require authorization.

## 12. User Experience

- [ ] Empty states exist.
- [ ] Loading states exist.
- [ ] Error states exist.
- [ ] Success states exist.
- [ ] Confirmation modals are clear.
- [ ] Mobile responsiveness is checked.
- [ ] Date/time format is user-friendly.
- [ ] Buttons have clear labels.

## 13. Production Readiness

- [ ] Logs are enabled.
- [ ] Backups are configured.
- [ ] Monitoring exists.
- [ ] Environment variables are configured.
- [ ] Error pages are friendly.
- [ ] Health check endpoint exists.
- [ ] Deployment rollback plan exists.
