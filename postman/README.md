# Bookmark LMS — DA3 Software Testing (Postman)

## Overview

This folder contains the Postman collection and environment for the **DA3 Software Testing** assignment covering:

| Category | # Tests | Description |
|---|---|---|
| **1. Functional E2E Tests** | 27 | Login, register, book CRUD, member ops, issue/return/renew, reservations, forgot/reset password, dashboard, reports, admin |
| **2. Boundary & Edge Case Tests** | 25 | Empty/missing inputs, wrong passwords, duplicate usernames, invalid emails, short passwords, invalid IDs, unauthorized access, forbidden roles, invalid JWT, negative copies |
| **3. Integration Tests** | 18 | DB persistence, inventory decrement/increment on issue/return, register→login→profile consistency, full loan lifecycle (issue→renew→return), dashboard/report verification, cleanup |

**Total: 70 tests** with JavaScript assertions for status codes, response body, and business rules.

---

## Files

| File | Purpose |
|---|---|
| `Bookmark_DA3_Collection.json` | Postman Collection (v2.1) — import into Postman |
| `Bookmark_DA3_Environment.json` | Postman Environment — variables for base URL, credentials, dynamic IDs |

---

## Prerequisites

1. **Java 17+** installed
2. **Maven** installed  
3. Backend runs on **port 8080** with embedded H2 database (no MySQL needed)

---

## How to Run

### 1. Start the Backend

```bash
cd backend
mvn spring-boot:run
```

Wait until you see `Demo accounts initialized` in the console. The app auto-creates 4 demo users:

| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@123` | ADMINISTRATOR |
| `librarian` | `Librarian@123` | LIBRARIAN |
| `member1` | `Member@123` | MEMBER |
| `member2` | `Member@123` | MEMBER |

### 2. Import into Postman

1. Open **Postman**
2. Click **Import** → drag or select `Bookmark_DA3_Collection.json`
3. Click **Import** → drag or select `Bookmark_DA3_Environment.json`
4. In the top-right corner, select the environment **"Bookmark LMS - DA3 Testing"**

### 3. Run with Collection Runner

1. Click the **"..."** menu on the collection → **Run collection**
2. Ensure the environment is set to **"Bookmark LMS - DA3 Testing"**
3. Keep **"Persist responses"** checked (for screenshots)
4. Click **Run Bookmark LMS — DA3 Software Testing**
5. Tests run **top to bottom** in dependency order

### 4. Take Screenshots

After the run completes, Postman shows a results summary with ✅/❌ for each test.
- Screenshot the **summary page** (shows pass/fail counts)
- Click individual requests to see **response body** and **test results** tabs for detailed screenshots

---

## Test Details

### Category 1: Functional E2E Tests (1.01–1.27)

Tests the full happy path:
- Login as Admin, Librarian, and Member (JWT tokens saved automatically)
- Register a new member
- Add, get, search, update, and delete books
- Get and search members, view current user profile
- Issue book → get active loans → get member loans → renew → return
- Reserve book → view reservations → cancel reservation
- Forgot password and reset password flows
- Dashboard stats and comprehensive reports
- Admin get all users

### Category 2: Boundary & Edge Case Tests (2.01–2.25)

- Empty/blank username login → 400
- Wrong password → 401
- Nonexistent user login → 401
- Duplicate username registration → 400/409
- Password too short (< 6 chars) → 400
- Invalid email format → 400
- Missing required fields → 400
- Book with missing title → 400
- Book with negative copies → 400
- Get book with invalid ID → 404
- Access without authentication → 401
- Member tries to add book → 403
- Member tries to issue book → 403
- Issue with invalid member/book ID → 404
- Return already returned loan → 400/404/409
- Return loan with invalid ID → 404
- Reserve with invalid book ID → 404
- Forgot password for nonexistent user → 404
- Reset password with short password → 400
- Member tries admin endpoint → 403
- Invalid JWT token → 401
- Empty request body for book → 400
- Update/delete nonexistent book → 404

### Category 3: Integration Tests (3.01–3.18)

- Create book → verify via GET (persistence)
- Issue book → verify `availableCopies` decremented
- Return book → verify `availableCopies` restored
- Register → login → verify `/me` profile consistency
- Full loan lifecycle: issue → renew → return
- Dashboard stats reflect operations
- Reports contain data
- Delete book → verify 404 on re-fetch

---

## Environment Variables

| Variable | Description | Auto-set? |
|---|---|---|
| `baseUrl` | Backend URL (default: `http://localhost:8080`) | Pre-set |
| `adminUsername` / `adminPassword` | Admin credentials | Pre-set |
| `librarianUsername` / `librarianPassword` | Librarian credentials | Pre-set |
| `memberUsername` / `memberPassword` | Member credentials | Pre-set |
| `adminToken` | JWT token for admin | ✅ Auto |
| `librarianToken` | JWT token for librarian | ✅ Auto |
| `memberToken` | JWT token for member | ✅ Auto |
| `testBookId` / `testBookId2` | Book IDs created during tests | ✅ Auto |
| `testLoanId` | Loan ID from issue test | ✅ Auto |
| `testReservationId` | Reservation ID | ✅ Auto |
| `testMemberId` | Registered member ID | ✅ Auto |

---

## Notes

- Tests must run **in order** — later tests depend on IDs/tokens from earlier tests
- The H2 database resets on each backend restart, so start fresh for clean test runs
- All passwords in the environment are the demo defaults from `DataInitializer.java`
