# Bookmark — Digital Library Management System

Bookmark LMS is a full-stack web application for managing library operations including book cataloguing, member registration, book issuing and returning, reservations, fine management, and administrative reporting.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Axios |
| Backend | Java 17, Spring Boot 3.2.5, Spring Web, Spring Data JPA, Spring Security, Spring Validation |
| Authentication | JWT (jjwt 0.11.5), BCrypt password encoding |
| Database | H2 (embedded, MySQL compatibility mode) · MySQL 8 (optional) |
| Build Tool | Maven |
| API Testing | Postman (Collection v2.1 with JavaScript assertions) |
| Utilities | Lombok |

---

## Prerequisites

- **Java** 17 or higher
- **Maven** 3.8+
- **Node.js** 18+ and **npm** 9+
- **Postman** (for API testing)
- **MySQL 8** (optional — the project defaults to an embedded H2 database)

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/harini777/bookmark-lms.git
cd bookmark-lms
```

### 2. Backend Setup

No additional configuration is required for the default H2 database. The application runs out of the box.

```bash
cd backend
mvn clean install -DskipTests
```

#### Switching to MySQL (Optional)

To use MySQL instead of H2, edit `backend/src/main/resources/application.properties`:

1. Comment out the H2 datasource block (lines 5–12).
2. Uncomment the MySQL datasource block (lines 15–19).
3. Set your MySQL credentials:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/bookmark_lms?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
```

> **Note:** Do not commit real database passwords. Use environment variables or a `.env.local` file (already excluded by `.gitignore`).

### 3. Frontend Setup

```bash
cd frontend
npm install
```

---

## Running the Application

### Start the Backend

```bash
cd backend
mvn spring-boot:run
```

The backend starts on **http://localhost:8080**. Wait for the log message `Demo accounts initialized` before proceeding.

### Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend starts on **http://localhost:5173**. API requests are proxied to the backend via the Vite dev server configuration in `vite.config.js`.

---

## Database Configuration

### Schema Initialisation

Spring Data JPA manages the schema automatically. The property `spring.jpa.hibernate.ddl-auto=update` creates and updates tables on startup. No manual migration scripts are required.

### Seed Data

The `DataInitializer` class (`backend/src/main/java/com/bookmark/config/DataInitializer.java`) creates four demo accounts on every startup if they do not already exist:

| Username | Password | Role |
|---|---|---|
| `admin` | `Admin@123` | ADMINISTRATOR |
| `librarian` | `Librarian@123` | LIBRARIAN |
| `member1` | `Member@123` | MEMBER |
| `member2` | `Member@123` | MEMBER |

### H2 Console

When using the H2 database, the H2 web console is available at **http://localhost:8080/h2-console** with JDBC URL `jdbc:h2:file:./data/bookmark_lms`, username `sa`, and an empty password.

---

## Authentication

The application uses JWT-based stateless authentication. All API endpoints except `/api/auth/**` require a valid `Authorization: Bearer <token>` header.

### Roles and Permissions

| Role | Permissions |
|---|---|
| **MEMBER** | Browse catalogue, view own profile and loans, renew loans, reserve and cancel reservations |
| **LIBRARIAN** | All MEMBER permissions plus manage books, manage members, issue and return books, view reports and dashboard |
| **ADMINISTRATOR** | All LIBRARIAN permissions plus manage user roles, database backup and restore |

---

## API Endpoints

All endpoints are prefixed with `/api`.

| Group | Method | Endpoint | Auth Required |
|---|---|---|---|
| **Auth** | POST | `/api/auth/login` | No |
| | POST | `/api/auth/register` | No |
| | POST | `/api/auth/forgot-password` | No |
| | POST | `/api/auth/reset-password` | No |
| **Books** | GET | `/api/books` | Yes |
| | GET | `/api/books/{id}` | Yes |
| | GET | `/api/books/search?query=` | Yes |
| | POST | `/api/books` | LIBRARIAN, ADMIN |
| | PUT | `/api/books/{id}` | LIBRARIAN, ADMIN |
| | DELETE | `/api/books/{id}` | LIBRARIAN, ADMIN |
| **Members** | GET | `/api/members` | LIBRARIAN, ADMIN |
| | GET | `/api/members/search?query=` | LIBRARIAN, ADMIN |
| | GET | `/api/members/{id}` | LIBRARIAN, ADMIN |
| | GET | `/api/members/me` | Yes |
| | PUT | `/api/members/{id}` | Yes |
| | PATCH | `/api/members/{id}/status?status=` | LIBRARIAN, ADMIN |
| **Loans** | POST | `/api/loans/issue` | LIBRARIAN, ADMIN |
| | PATCH | `/api/loans/{id}/return` | LIBRARIAN, ADMIN |
| | PATCH | `/api/loans/{id}/renew` | Yes |
| | PATCH | `/api/loans/{id}/pay-fine` | Yes |
| | POST | `/api/loans/{id}/report?status=&penalty=` | LIBRARIAN, ADMIN |
| | GET | `/api/loans/active` | LIBRARIAN, ADMIN |
| | GET | `/api/loans/overdue` | LIBRARIAN, ADMIN |
| | GET | `/api/loans/member/{memberId}` | Yes |
| | GET | `/api/loans/member/{memberId}/active` | Yes |
| | GET | `/api/loans/dashboard` | LIBRARIAN, ADMIN |
| **Reservations** | POST | `/api/reservations/book/{bookId}` | Yes |
| | PATCH | `/api/reservations/{id}/cancel` | Yes |
| | GET | `/api/reservations/member/{memberId}` | Yes |
| | GET | `/api/reservations/active` | LIBRARIAN, ADMIN |
| **Reports** | GET | `/api/reports` | LIBRARIAN, ADMIN |
| **Admin** | GET | `/api/admin/users` | ADMIN |
| | PATCH | `/api/admin/users/{id}/role?role=` | ADMIN |
| | GET | `/api/admin/backup` | ADMIN |
| | POST | `/api/admin/restore` | ADMIN |

---

## API Testing with Postman

### Collection Location

```
postman/
├── Bookmark_DA3_Collection.json    # Postman Collection (v2.1)
├── Bookmark_DA3_Environment.json   # Environment variables
└── README.md                       # Detailed testing guide
```

### Import and Setup

1. Open Postman and click **Import**.
2. Select `postman/Bookmark_DA3_Collection.json` and `postman/Bookmark_DA3_Environment.json`.
3. Set the active environment to **Bookmark LMS - DA3 Testing** (top-right dropdown).
4. Verify that `baseUrl` is set to `http://localhost:8080`.

### Running Tests

1. Ensure the backend is running on port 8080.
2. Open the collection, click **"…" → Run collection**.
3. Run all requests in order. Tests are organised into three folders:

| Folder | Tests | Description |
|---|---|---|
| 1. Functional E2E Tests | 27 | Login, registration, book CRUD, member operations, issue/return/renew, reservations, password management, dashboard, reports |
| 2. Boundary & Edge Case Tests | 25 | Invalid credentials, duplicate records, missing fields, invalid IDs, unauthorised access, forbidden roles, invalid JWT |
| 3. Integration Tests | 18 | Database persistence, inventory consistency, registration-to-login flow, full loan lifecycle, report verification |

Tokens and resource IDs are passed between requests automatically via environment variables. Tests must run in order.

---

## Project Structure

```
bookmark-lms/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/bookmark/
│       ├── BookmarkLmsApplication.java
│       ├── config/          # SecurityConfig, DataInitializer
│       ├── controller/      # REST controllers (Auth, Book, Loan, Member, Reservation, Report, Admin)
│       ├── dto/             # Request and response DTOs
│       ├── entity/          # JPA entities (User, Book, Loan, Reservation)
│       ├── exception/       # Global exception handling
│       ├── repository/      # Spring Data JPA repositories
│       ├── security/        # JWT filter, token provider, UserDetailsService
│       └── service/         # Business logic services
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── api/             # Axios instance and endpoint definitions
│       ├── components/      # Reusable UI components
│       ├── context/         # React context (AuthContext)
│       ├── pages/           # Page components (Login, Register, Catalogue, Loans, Members, Admin, Reports)
│       ├── App.jsx          # Root component with routing
│       ├── main.jsx         # Entry point
│       └── index.css        # Global styles
├── postman/                 # Postman collection and environment for DA3 testing
└── .gitignore
```

---

## Troubleshooting

| Issue | Solution |
|---|---|
| `JAVA_HOME` not set or wrong version | Ensure Java 17+ is installed and `JAVA_HOME` points to it. Verify with `java -version`. |
| Backend fails to start on port 8080 | Another process may be using the port. Check with `lsof -i :8080` and terminate it, or change `server.port` in `application.properties`. |
| Frontend cannot reach the backend | Ensure the backend is running on port 8080 before starting the frontend. The Vite proxy in `vite.config.js` forwards `/api` requests to `http://localhost:8080`. |
| H2 database locked error | Stop any other running instance of the backend. Delete the `backend/data/` directory and restart. |
| MySQL connection refused | Verify MySQL is running, the `bookmark_lms` database exists or `createDatabaseIfNotExist=true` is set, and the credentials in `application.properties` are correct. |
| Postman tests fail with 401 | Run the collection from the beginning. Login requests at the top set JWT tokens used by subsequent requests. |
| `npm install` fails | Delete `frontend/node_modules` and `frontend/package-lock.json`, then run `npm install` again. |
| Maven build fails | Run `mvn clean install -DskipTests` to isolate compilation issues from test failures. |
