# Alumni Link — Full-Stack Application

A Student–Alumni Mentorship & Referral Portal with:
- **Frontend**: React + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Spring Boot 3.2 + Spring Security + JWT + PostgreSQL + Flyway

---

## Quick Start

### Prerequisites
- Java 17+, Maven 3.8+
- Node.js 18+ (or Bun)
- PostgreSQL 14+

---

### Step 1: Set Up Database

```sql
-- In psql or pgAdmin:
CREATE DATABASE alumni_link;
```

---

### Step 2: Configure Backend

Edit `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/alumni_link
spring.datasource.username=postgres
spring.datasource.password=YOUR_PASSWORD

# Generate a strong 256-bit secret for JWT
app.jwt.secret=replace-with-a-very-long-random-string-at-least-32-chars
app.jwt.expiration-ms=86400000

# Allowed frontend origins
app.cors.allowed-origins=http://localhost:5173,http://localhost:3000
```

---

### Step 3: Start Backend

```bash
cd backend
mvn spring-boot:run
```

The API will start on **http://localhost:8080**

Flyway automatically creates all tables on first startup.

### Account Approval
New `student`/`alumni` accounts are created as pending and cannot sign in until an admin approves them via:
- `GET /api/admin/users/pending`
- `PATCH /api/admin/users/{id}/approve`

---

### Step 4: Configure & Start Frontend

```bash
# In project root
cp .env.example .env
# .env already has: VITE_API_BASE_URL=http://localhost:8080/api

npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## Project Structure

```
alumni-link-integrated/
├── backend/                    ← Spring Boot backend
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/alumnilink/
│       │   ├── controller/     ← REST endpoints
│       │   ├── service/        ← Business logic
│       │   ├── repository/     ← JPA repos
│       │   ├── model/          ← Entities
│       │   ├── dto/            ← Request/Response objects
│       │   ├── security/       ← JWT + Spring Security
│       │   └── config/         ← Security config, CORS, error handling
│       └── resources/
│           ├── application.properties
│           └── db/migration/V1__init_schema.sql
│
├── src/                        ← React frontend
│   ├── integrations/api/
│   │   └── client.ts           ← Central REST API client
│   ├── contexts/AuthContext.tsx ← JWT-based auth context
│   ├── hooks/
│   │   ├── useJobs.ts
│   │   ├── useMentorRequests.ts
│   │   ├── useProfiles.ts
│   │   └── useRealtimeNotifications.ts (polling-based)
│   └── pages/                  ← All pages fully integrated
│
├── .env                        ← VITE_API_BASE_URL=http://localhost:8080/api
└── package.json
```

---

## API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET/PATCH | `/api/profiles/me` | Any role |
| GET | `/api/profiles/alumni` | Any role |
| GET/POST | `/api/jobs` | GET: Any; POST: Alumni/Admin |
| GET/POST | `/api/mentorship` | Authenticated |
| PATCH | `/api/mentorship/{id}/status` | Alumni |
| GET | `/api/chats` | Student/Alumni (after mentorship approval) |
| POST | `/api/chats/from-mentorship/{mentorshipId}` | Student/Alumni |
| GET/POST | `/api/chats/{threadId}/messages` | Student/Alumni |
| GET/POST | `/api/events` | GET: Any; POST: Alumni/Admin |
| GET/POST | `/api/discussions` | Authenticated |
| GET/POST | `/api/stories` | GET: Any; POST: Alumni/Admin |

---

## Build for Production

### Frontend
```bash
npm run build
# Output in dist/
```

### Backend
```bash
cd backend
mvn clean package
java -jar target/alumni-link-backend-1.0.0.jar
```
