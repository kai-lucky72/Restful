# Software Engineering Standards Pack

This folder contains practical `.md` guides for building safer, cleaner, real-world software systems.

Use these files in your project repository as internal development rules for backend, frontend, QA, and admin features.

## Files

1. `01-error-validation-standards.md`  
   Rules for validation, error messages, API responses, and edge cases.

2. `02-env-and-secrets-standards.md`  
   Rules for environment variables, credentials, SMTP, database passwords, tokens, and secret handling.

3. `03-auth-signup-login-standards.md`  
   Standards for signup, login, OTP, password reset, sessions, and account security.

4. `04-critical-user-actions-standards.md`  
   Standards for delete account, update profile, delete data, payments, and confirmation flows.

5. `05-admin-logs-and-audit-standards.md`  
   Rules for admin logs, audit trails, security logs, and traceability.

6. `06-small-details-checklist.md`  
   A checklist of details many software engineers forget.

## Recommended Usage

- Keep this folder in your project as `/docs/standards/`.
- Before building a feature, read the related file.
- Before submission or deployment, review `06-small-details-checklist.md`.
- Never commit real secrets into GitHub.
