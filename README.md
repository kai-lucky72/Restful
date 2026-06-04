# Fire Extinguisher Management System

RESTful microservices platform for TZW LTD fire safety operations.

The system manages fire extinguishers, inspections, maintenance, compliance reports, notifications, users, and JWT authentication. The frontend is React + Vite + Tailwind and consumes the API gateway at `http://localhost:5000/api/v1`.

## Stack

- Frontend: React, Vite, Tailwind CSS, Axios, Recharts
- Backend: Node.js, Express, Sequelize
- Database: PostgreSQL
- Auth: JWT access tokens + refresh tokens
- Docs: Swagger UI per service plus gateway docs
- Architecture: RESTful microservices behind an API gateway

## Services

| Service | Port | Swagger |
|---|---:|---|
| API Gateway | 5000 | `http://localhost:5000/api-docs` |
| Auth Service | 4001 | `http://localhost:4001/api-docs` |
| User Service | 4002 | `http://localhost:4002/api-docs` |
| Extinguisher Service | 4003 | `http://localhost:4003/api-docs` |
| Inspection & Maintenance Service | 4004 | `http://localhost:4004/api-docs` |
| Reporting Service | 4005 | `http://localhost:4005/api-docs` |
| Notification Service | 4006 | `http://localhost:4006/api-docs` |
| Frontend | 5173 | `http://localhost:5173` |

## Database

Create the PostgreSQL database once:

```sql
CREATE DATABASE fire_extinguisher_db;
```

The services create their own schemas automatically:

- `auth`
- `user`
- `extinguisher`
- `inspection`
- `notification`

## Environment

The root `.env` is shared by all services. Important values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fire_extinguisher_db
DB_USER=postgres
DB_PASSWORD=lucky

GATEWAY_PORT=5000
AUTH_PORT=4001
USER_PORT=4002
EXTINGUISHER_PORT=4003
INSPECTION_PORT=4004
REPORTING_PORT=4005
NOTIFICATION_PORT=4006
```

Do not commit `.env`. Use `.env.example` for sample values only.

## Run Backend

Open separate terminals:

```bash
cd shared && npm install
cd services/auth-service && npm install && npm run dev
cd services/user-service && npm install && npm run dev
cd services/extinguisher-service && npm install && npm run dev
cd services/inspection-service && npm install && npm run dev
cd services/reporting-service && npm install && npm run dev
cd services/notification-service && npm install && npm run dev
cd gateway && npm install && npm run dev
```

Health checks:

```text
http://localhost:5000/api/v1/health
http://localhost:4001/health
http://localhost:4002/health
http://localhost:4003/health
http://localhost:4004/health
http://localhost:4005/health
http://localhost:4006/health
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Demo login:

```text
admin@tzw.rw / Admin123!
```

## API Gateway Routes

The frontend calls the gateway:

```text
http://localhost:5000/api/v1
```

Gateway route map:

- `/auth/*` -> Auth Service
- `/users/*` -> User Service
- `/extinguishers/*` -> Extinguisher Service
- `/inspections/*` -> Inspection & Maintenance Service
- `/reports/*` -> Reporting Service
- `/notifications/*` -> Notification Service

## Implemented Exam Requirements

- User registration and login through frontend
- JWT authentication and role-based authorization
- Fire extinguisher CRUD
- Inspection scheduling and inspection performance logging
- Maintenance logging
- Real-time dashboard/reporting APIs
- PDF and CSV report export
- Simulated notification logging
- Pagination on list endpoints
- Swagger documentation
- Validation and safe error handling
- CORS and Helmet security middleware
- Responsive frontend with loading, empty, error, and success states

## Useful Report Export URLs

Authenticated requests:

```text
GET /api/v1/reports/export?type=inventory&format=csv
GET /api/v1/reports/export?type=inventory&format=pdf
GET /api/v1/reports/export?type=compliance&format=csv
GET /api/v1/reports/export?type=inspections&format=pdf
GET /api/v1/reports/export?type=maintenance&format=csv
```

## Postman

Import these two files:

```text
postman/TZW-Fire-Safety.postman_collection.json
postman/TZW-Fire-Safety.postman_environment.json
```

Run `POST - Login Admin` first. It stores `TOKEN`, `REFRESH_TOKEN`, and `USER_ID` automatically.

## Operating Notes

- Keep PostgreSQL running before starting services.
- Start backend services before the frontend.
- Use the API gateway URL in the frontend.
- Use Swagger and Postman/cURL to prove endpoints.
- Auth emails use SMTP when `MAIL_MODE=smtp` and `SMTP_*` values are configured. Notification delivery remains simulated for local development.
