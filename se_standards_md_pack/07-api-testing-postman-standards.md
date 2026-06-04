# 07 - API Testing & Postman Standards

## 1. Purpose

This document defines standards for testing APIs and backend systems using Postman.

Every backend project must include:

* API testing
* Validation testing
* Authentication testing
* Error handling testing
* Business rule testing

The goal is to ensure the system behaves like a real production-ready application.

---

# 2. Required Deliverables

Every backend/API project must include:

* Postman Collection JSON
* Organized request folders
* Environment variables
* Automated API tests
* Validation test cases
* Authentication tests
* Error scenario tests

---

# 3. Required Postman Folders

Organize collections clearly.

Example:

```text
Authentication
Users
Admin
Parking
Payments
Reports
Expenses
Payroll
Robotics
System
```

---

# 4. Naming Standards

Use clean names.

Good:

```text
POST - Create User
POST - Login
GET - All Parking
PUT - Update Employee
DELETE - Remove Expense
```

Bad:

```text
test1
new req
api test
```

---

# 5. Environment Variables

Use Postman environments.

Example variables:

```text
BASE_URL
TOKEN
ADMIN_TOKEN
USER_ID
PARKING_ID
EXPENSE_ID
EMPLOYEE_ID
```

Never hardcode URLs repeatedly.

Good:

```text
{{BASE_URL}}/api/v1/users
```

---

# 6. Authentication Testing

Test:

* Valid login
* Invalid login
* Missing password
* Missing token
* Expired token
* Wrong role access
* Logout
* Refresh token if used

Example tests:

* User cannot access admin route
* Expired JWT returns 401
* Invalid token returns safe error

---

# 7. CRUD Testing Standards

Every entity must test:

## CREATE

* Valid creation
* Missing fields
* Duplicate values
* Invalid formats

## READ

* Get single item
* Get all items
* Pagination
* Empty results

## UPDATE

* Valid update
* Invalid ID
* Unauthorized update
* Validation failure

## DELETE

* Valid delete
* Already deleted
* Unauthorized delete
* Soft delete behavior

---

# 8. Validation Testing

Test all validations.

Examples:

* Empty fields
* Invalid email
* Invalid phone
* Negative amount
* Invalid date
* Invalid role
* Invalid enum values
* File upload validation

---

# 9. Business Rule Testing

Test real-world logic.

Examples:

## Parking System

* Cannot park when no spaces remain
* Exit updates available spaces
* Duplicate plate number prevented

## Payroll System

* Duplicate payroll for same month prevented
* Inactive employee excluded
* Deductions cannot exceed salary

## Finance App

* Expense amount cannot be negative
* Budget limit notification triggered

## DSA Project

* Duplicate city prevented
* Budget cannot exist without road

---

# 10. Standard Automated Postman Tests

Every request should include tests.

Example:

```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response success is true", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
});
```

---

# 11. Error Response Testing

Verify:

* Correct HTTP status
* Correct error message
* Safe error structure
* No stack traces exposed

Bad:

```json
{
  "stack": "SQLException..."
}
```

Good:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

---

# 12. Pagination Testing

Every list endpoint should test:

* page
* limit
* empty page
* invalid page

Example:

```text
GET /users?page=1&limit=10
```

---

# 13. Search & Filter Testing

Test:

* search by keyword
* date filters
* status filters
* invalid filters
* empty search results

---

# 14. Role & Permission Testing

Test all roles separately.

Examples:

* Admin can delete
* User cannot delete
* Manager can process payroll
* Employee can only view own payslip

---

# 15. File Upload Testing

Test:

* valid file
* invalid file type
* oversized file
* empty upload

---

# 16. Performance Testing

Basic checks:

* API should not freeze
* Repeated requests should not crash app
* Duplicate submissions prevented

---

# 17. Postman Collection Standards

Collections must:

* Be exportable
* Use folders
* Include descriptions
* Include automated tests
* Include authentication setup

---

# 18. Swagger & Postman

If Swagger exists:

* Ensure all endpoints are tested in Postman too
* Swagger documentation must match API behavior

---

# 19. Mock Data Standards

Use realistic data.

Good:

```text
Kigali Parking A
RAB Employee
078XXXXXXX
```

Bad:

```text
abc
123
test
```

---

# 20. AI Agent Requirements

The AI coding assistant must automatically generate:

* Postman Collection JSON
* Environment JSON
* Automated tests
* Validation tests
* Authentication tests
* Business rule tests
* Error scenario tests

The AI must test:

* success cases
* failure cases
* unauthorized cases
* invalid data cases
* duplicate data cases

---

# 21. Final Testing Checklist

Before submission:

* [ ] All endpoints tested
* [ ] JWT tested
* [ ] Role permissions tested
* [ ] Validation tested
* [ ] Error responses tested
* [ ] Duplicate prevention tested
* [ ] Pagination tested
* [ ] Search/filter tested
* [ ] Postman collection exports correctly
* [ ] No backend crash on invalid input
* [ ] No stack traces exposed
* [ ] Business rules validated
* [ ] Swagger matches implementation
* [ ] Empty states handled
* [ ] Loading/error/success states tested
