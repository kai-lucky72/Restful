# FES — Shared Business-Logic & API Contract (single source of truth)

Both the frontend and backend MUST build to this contract so they stay in sync.
All values below are CANONICAL — copy the exact strings.

Company: **TZW LTD** manages fire extinguishers for clients (schools, hotels, companies, shops/pharmacies).

---

## 1. Roles (exact strings)
`ADMIN` · `INSPECTOR` · `USER`

- Self-signup ALWAYS creates `USER`. The role field is ignored on `/auth/register`.
- Only `ADMIN` can change roles or create `INSPECTOR`/extra users.
- Data access:
  - ADMIN → all data
  - INSPECTOR → inspections assigned to them + related extinguishers/maintenance
  - USER → only their own extinguishers, requests, inspections, maintenance

---

## 2. Extinguisher lifecycle status (exact strings, stored on the record)
`AVAILABLE` → `ASSIGNED` → `ACTIVE` → (`INSPECTION_DUE` / `UNDER_INSPECTION` / `NEEDS_MAINTENANCE`) → `ACTIVE` → `EXPIRED`
Plus: `REPLACEMENT_REQUIRED`, `ARCHIVED` (soft delete).

Meaning:
- `AVAILABLE` — in TZW stock, `userId=null`, `installationDate=null`
- `ASSIGNED` — admin assigned to a user, not yet installed (`assignedAt` set, `installationDate=null`)
- `ACTIVE` — installed (`installationDate` set)
- `INSPECTION_DUE` — derived overlay when next inspection is near/overdue
- `UNDER_INSPECTION` — an inspector is assigned/working
- `NEEDS_MAINTENANCE` — inspector found an issue
- `EXPIRED` — `expiryDate < today` (derived overlay; always wins)
- `REPLACEMENT_REQUIRED` — maintenance concluded it must be replaced
- `ARCHIVED` — soft-deleted (never hard delete important records)

Derived flags returned on every extinguisher read: `isExpired`, `inspectionDue`, `daysUntilExpiry`, `compliant`.
**Compliant** = not EXPIRED AND inspected within interval AND not NEEDS_MAINTENANCE/REPLACEMENT_REQUIRED.

Types: `WATER` `CO2` `FOAM` `DRY_CHEMICAL`
Sizes: `1.5_LB` `5_LB` `9_LB` `12_LB`

Date rule: `installationDate` only required at install; must be within 7 days after `assignedAt`. `expiryDate > installationDate`.

---

## 3. Requests (extinguisher_requests)
Status: `PENDING` `APPROVED` `REJECTED` `INFO_REQUESTED`
Flow: USER creates (PENDING) → ADMIN reviews (APPROVE/REJECT/REQUEST_MORE_INFO with comment).

Fields: `id, userId, quantity, location, reason, status, requestedAt, reviewedByAdminId, reviewedAt, adminComment`.

---

## 4. Inspections
Status: `REQUESTED` `SCHEDULED` `UNDER_INSPECTION` `COMPLETED` `COMPLETED_WITH_ISSUES` `CANCELLED`
Result: `PASSED` `FAILED` `NEEDS_MAINTENANCE` `EXPIRED` `PENDING`

Flow:
- USER schedules → `REQUESTED` (notifies admin + inspectors + user)
- ADMIN schedules / assigns inspector → `SCHEDULED`
- Inspector starts → `UNDER_INSPECTION`; submits result:
  - `PASSED` → extinguisher `ACTIVE`, inspection `COMPLETED`
  - `FAILED`/`NEEDS_MAINTENANCE` → extinguisher `NEEDS_MAINTENANCE`, inspection `COMPLETED_WITH_ISSUES`
  - `EXPIRED` → extinguisher `EXPIRED`
- Prevent double-booking same extinguisher at same date+time.

Fields: `id, extinguisherId, requestedByUserId, scheduledByAdminId, assignedInspectorId, scheduledDate, scheduledTime, status, result, issuesFound, notes, recommendations, performedDate`.

---

## 5. Maintenance logs
Created by INSPECTOR after an issue. Fields: `id, extinguisherId, inspectionId, inspectorId, actionTaken, issuesIdentified, maintenanceDate, notes, recommendations, statusAfterMaintenance` (`ACTIVE` or `REPLACEMENT_REQUIRED`).

---

## 6. Notifications
Types: `EXT_ASSIGNED, REQUEST_SUBMITTED, REQUEST_REVIEWED, INSPECTION_REQUESTED, INSPECTION_SCHEDULED, INSPECTOR_ASSIGNED, INSPECTION_DUE, INSPECTION_OVERDUE, EXT_EXPIRING, EXT_EXPIRED, MAINTENANCE_REQUIRED, MAINTENANCE_COMPLETED`.
Fields: `id, userId, type, message, isRead, createdAt`. Recipients = User, Admin, Assigned Inspector as relevant.

---

## 7. Audit logs (admin only)
Every important action logs: `id, actorId, actorRole, action, targetType, targetId, oldValue, newValue, createdAt`.

---

## 8. API (gateway base: `http://localhost:5000/api/v1`)
Standard envelope: success `{success, message, data, meta?}`; error `{success:false, message, code, errors?}`.
All lists: `?page=&limit=` + `meta:{page,limit,total,totalPages}`.

- **/auth**: POST register, login, refresh, logout, forgot-password, reset-password; GET me
- **/users** (ADMIN unless noted): GET / (list), POST / (create inspector/user), GET /me, PUT /me, PUT /me/password, GET /:id, PATCH /:id/role, PATCH /:id/status, DELETE /:id (soft)
- **/extinguishers**: GET / (role-scoped), GET /:id, POST / (ADMIN create/register), PUT /:id (ADMIN), PATCH /:id/assign {userId} (ADMIN→ASSIGNED), PATCH /:id/install {installationDate} (ASSIGNED→ACTIVE), DELETE /:id (ADMIN soft→ARCHIVED), POST /recompute-statuses
- **/requests**: POST / (USER), GET / (role-scoped), PATCH /:id/review {decision, adminComment} (ADMIN)
- **/inspections**: GET / (role-scoped), POST / (USER request | ADMIN schedule), PATCH /:id/assign {inspectorId} (ADMIN), PATCH /:id/start (INSPECTOR), PATCH /:id/perform {result, issuesFound, notes, recommendations} (INSPECTOR), DELETE /:id (cancel)
- **/inspections/maintenance**: GET / (role-scoped), POST / (INSPECTOR)
- **/reports**: GET /dashboard (ROLE-AWARE payload), /inventory, /inspections, /compliance, /maintenance, /export?type=&format=pdf|csv (all role-scoped)
- **/notifications**: GET /, GET /unread-count, PATCH /:id/read, PATCH /read-all, POST /internal (service key)
- **/audit-logs**: GET / (ADMIN)

Role-aware dashboard payload (`/reports/dashboard`) must return tiles + chart data scoped to the caller:
- ADMIN: total extinguishers, compliance %, overdue inspections, expiring≤30, pending requests; charts: statusDistribution, typeDistribution, inspectionSummary
- INSPECTOR: assigned inspections, completed by me, pending mine, maintenance I logged; charts: my inspection results, upcoming schedule
- USER: my extinguishers, my compliant %, my upcoming inspections, my expiring soon; charts: my status distribution

---

## 9. Mock data to seed (respect the flow above)
- **1 Admin**: `admin@tzw.rw` / `Admin123!`
- **3 Inspectors**: `inspector1@tzw.rw`, `inspector2@tzw.rw`, `inspector3@tzw.rw` / `Inspect123!`
- **4 Users (clients)** / `User123!`:
  - Company → `company@tzw.rw` (e.g. "Kigali Heights Ltd")
  - School → `school@tzw.rw` (e.g. "Green Hills Academy")
  - Damas (pharmacy/shop) → `damas@tzw.rw` (e.g. "Damas Pharmacy")
  - Hotel → `hotel@tzw.rw` (e.g. "Serena Hotel Kigali")
- **20 extinguishers** with realistic serials (FE-2026-KGL-0001…), varied types/sizes/locations, spread across statuses: a few AVAILABLE (stock), most ASSIGNED/ACTIVE across the 4 clients, some EXPIRED, some NEEDS_MAINTENANCE, some expiring within 30/60/90 days.
- A handful of **requests** (PENDING + reviewed), **inspections** (REQUESTED/SCHEDULED/COMPLETED/COMPLETED_WITH_ISSUES across inspectors), **maintenance logs**, and **notifications** so every dashboard and report looks populated.

Each USER must only ever see their own extinguishers/inspections/requests.

---

## 10. Design language (frontend)
Liquid-glass / "classified premium" feel: frosted glass cards (`backdrop-blur`, translucent white, soft ring + top highlight), fire-red→amber gradient brand accents over clean charcoal/white surfaces (accents not full backgrounds), Inter, lucide icons, recharts. Smooth transitions, hover lift, skeletons, empty/error states, toasts. Three distinct role dashboards. Polished login/register with a role-aware experience (signup is USER-only but the brand panel should communicate the three roles).
