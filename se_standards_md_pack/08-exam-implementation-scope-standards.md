# 08 - Exam Implementation Scope Standards

## 1. Purpose

This document defines the realistic implementation scope for national practical exams.

The goal is:

* Build working software
* Simulate real-world systems
* Avoid overengineering
* Finish within exam time
* Focus on correctness, validation, UI/UX, and business logic

The project should look professional and usable by real users.

---

# 2. Core Rule

The system must feel production-ready without requiring enterprise-scale infrastructure.

Focus on:

* functionality
* validation
* business logic
* clean UI
* security basics
* stability
* proper API design
* proper database structure

Do NOT waste time building unnecessary enterprise infrastructure.

---

# 3. Features That SHOULD Be Implemented

## Backend

* CRUD operations
* JWT authentication
* Role-based authorization
* Validation
* Pagination
* Search/filter
* Reports
* File saving
* Logging
* Safe error handling
* Swagger documentation
* Environment variables
* Password hashing

## Frontend/Mobile

* Responsive UI
* Loading states
* Error states
* Empty states
* Form validation
* Confirmation dialogs
* Clean navigation
* Realistic UX behavior

## Database

* Relationships
* Foreign keys
* Unique constraints
* CreatedAt/UpdatedAt
* Proper normalization

---

# 4. Features That Should Be SIMULATED

These may be mocked or simplified:

## Payments

Instead of real payment gateways:

* simulate payment success/failure
* generate invoice
* update payment status

Good:

```text
Payment completed successfully.
```

No need for:

* MTN MoMo API
* Stripe
* Visa integration

---

## Notifications

Instead of real SMS/email:

* log notification
* simulate send success
* show confirmation message

Example:

```text
Salary notification sent successfully.
```

---

## OTP

Use:

* generated code
* expiration logic
* validation

No need for:

* Twilio
* Africa's Talking
* Firebase SMS

---

## Cloud Storage

Use:

* local uploads
* local file storage

No need for:

* AWS S3
* Azure Blob
* Google Cloud Storage

---

## Hosting & Deployment

No need for:

* VPS setup
* Docker Swarm
* Kubernetes
* CI/CD pipelines
* Domain setup

The app only needs to run properly locally.

---

# 5. Features That Are OPTIONAL

Only add if time allows:

* dark mode
* advanced analytics
* charts
* export PDF
* advanced caching
* websocket realtime updates
* advanced animations
* advanced AI features

---

# 6. Features That SHOULD NOT Be Prioritized

Avoid spending too much time on:

* microservice orchestration
* production DevOps
* advanced cloud architecture
* distributed systems
* advanced ML training
* scalable infrastructure
* Kubernetes
* Kafka
* Redis clustering
* payment provider integration
* enterprise monitoring systems

---

# 7. Time Management Standards

Practical exams are time-limited.

Priority order:

## Phase 1

* Understand scenario
* Database design
* ERD
* API planning
* UI planning

## Phase 2

* Authentication
* Core CRUD
* Validation
* Database relationships

## Phase 3

* Business logic
* Reports
* Role permissions

## Phase 4

* UI polishing
* Testing
* Bug fixing
* Postman tests

---

# 8. UI/UX Standards

The app should look clean and usable.

Required:

* spacing consistency
* readable forms
* aligned buttons
* readable tables
* success/error alerts
* loading indicators
* confirmation dialogs

Avoid:

* overcrowded screens
* broken layouts
* unreadable colors
* giant forms without grouping

---

# 9. Error Handling Standards

The application must NEVER crash from invalid user input.

Must handle:

* invalid IDs
* empty fields
* invalid dates
* duplicate records
* wrong login
* expired token
* invalid role access
* database errors safely

Users must see safe messages only.

---

# 10. Realistic Data Standards

Use meaningful data.

Good:

```text
Kigali Parking A
Muhanga Road
Employee Payroll
Transportation Budget
```

Bad:

```text
test
abc
123
```

---

# 11. REST/Java Standards

Backend systems should prioritize:

* JWT
* Swagger
* pagination
* validation
* logs
* role-based access
* reports
* DTOs
* service layer separation

---

# 12. Mobile Standards

Mobile apps should prioritize:

* login flow
* CRUD
* API integration
* loading indicators
* offline-safe handling
* responsive screens
* navigation

---

# 13. DSA Standards

DSA projects should prioritize:

* menu stability
* correct algorithms
* duplicate prevention
* validation
* file handling
* adjacency matrices
* search correctness

Never allow crashes from wrong input.

---

# 14. Robotics Standards

Robotics projects should prioritize:

* sensor validation
* safe hardware handling
* retry logic
* serial communication clarity
* safe fallback behavior

The hardware should never enter unsafe states.

---

# 15. Machine Learning Standards

Machine learning practicals should focus on:

* clean dataset handling
* preprocessing
* simple training/testing
* evaluation metrics
* visualization
* understandable outputs

Do NOT overbuild large AI systems.

Simple working ML is better than incomplete advanced ML.

---

# 16. Professionalism Standards

The project should appear:

* organized
* stable
* realistic
* user-friendly
* safe
* complete

Even simple systems can score highly if:

* validation is strong
* UX is clean
* business logic works
* errors are handled safely
* APIs are documented
* testing exists

---

# 17. AI Coding Assistant Rules

The AI assistant must:

* avoid unnecessary complexity
* generate realistic business logic
* prioritize stability
* prioritize validation
* prioritize testing
* generate Postman collections
* generate Swagger docs
* generate safe API responses
* prevent crashes
* prevent exposing backend internals

The AI should optimize for:

* exam completion
* correctness
* usability
* clean architecture
* maintainability

Not enterprise-scale infrastructure.

---

# 18. Final Exam Submission Checklist

* [ ] Application runs successfully
* [ ] Authentication works
* [ ] CRUD works
* [ ] Validation works
* [ ] Role permissions work
* [ ] Database relationships work
* [ ] Errors handled safely
* [ ] No crashes on invalid input
* [ ] Reports work
* [ ] Pagination works
* [ ] UI is clean
* [ ] APIs documented
* [ ] Postman collection exists
* [ ] Passwords hashed
* [ ] Sensitive data protected
* [ ] Empty/loading/error states handled
* [ ] Business logic behaves correctly
* [ ] Project feels realistic and usable
