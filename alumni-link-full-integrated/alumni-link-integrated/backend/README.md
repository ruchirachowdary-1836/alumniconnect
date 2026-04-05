# Alumni Link — Spring Boot Backend

This is the Spring Boot backend for the Alumni Link platform.

## Tech Stack
- **Spring Boot 3.2** + Spring Security
- **PostgreSQL** (same database schema)
- **JWT** authentication (stateless, no sessions)
- **Flyway** for database migrations
- **JPA / Hibernate** for ORM
- **Lombok** for boilerplate reduction

## Project Structure
```
src/main/java/com/alumnilink/
├── AlumniLinkApplication.java      # Entry point
├── config/
│   ├── SecurityConfig.java          # Security + CORS config
│   └── GlobalExceptionHandler.java  # Centralized error handling
├── controller/
│   ├── AuthController.java
│   ├── ProfileController.java
│   ├── JobController.java
│   ├── MentorshipController.java
│   ├── EventController.java
│   ├── DiscussionController.java
│   └── SuccessStoryController.java
├── service/                         # Business logic
├── repository/                      # Spring Data JPA repos
├── model/                           # JPA entities
├── dto/                             # Request/Response DTOs
└── security/
    ├── JwtUtils.java
    ├── JwtAuthFilter.java
    ├── UserDetailsServiceImpl.java
    └── SecurityUtils.java
```

## Setup & Running

### 1. Prerequisites
- Java 17+
- Maven 3.8+
- PostgreSQL 14+

### 2. Database Setup
```sql
CREATE DATABASE alumni_link;
```
Flyway will auto-run migrations on startup.

### 3. Configure `application.properties`
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/alumni_link
spring.datasource.username=postgres
spring.datasource.password=yourpassword
app.jwt.secret=your-256-bit-secret-replace-me
app.cors.allowed-origins=http://localhost:5173
```

### 4. Build & Run
```bash
mvn spring-boot:run
# or
mvn clean package
java -jar target/alumni-link-backend-1.0.0.jar
```

Server starts on **http://localhost:8080**

## REST API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (student/alumni/admin) |
| POST | `/api/auth/login` | Login, returns JWT token |

**Approval flow:** new `student`/`alumni` accounts are created as pending and cannot log in until an admin approves them.
Admin endpoints:
- `GET /api/admin/users/pending`
- `PATCH /api/admin/users/{id}/approve`
- `DELETE /api/admin/users/{id}` (reject)

**Register body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "role": "student"
}
```

**All protected endpoints require:**
```
Authorization: Bearer <token>
```

### Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/profiles` | All profiles (with roles) |
| GET | `/api/profiles/alumni` | Alumni profiles only |
| GET | `/api/profiles/me` | Current user's profile |
| GET | `/api/profiles/{id}` | Profile by ID |
| PATCH | `/api/profiles/me` | Update own profile |

### Jobs
| Method | Endpoint | Auth Role |
|--------|----------|-----------|
| GET | `/api/jobs` | Any |
| GET | `/api/jobs/{id}` | Any |
| POST | `/api/jobs` | Alumni/Admin |
| PATCH | `/api/jobs/{id}/status` | Job owner |
| DELETE | `/api/jobs/{id}` | Job owner |

### Referral Requests (Resume Upload)
| Method | Endpoint | Auth Role |
|--------|----------|-----------|
| POST | `/api/jobs/{jobId}/referral-requests` | Student (multipart: `resume`, optional `message`) |
| GET | `/api/referral-requests/student` | Student (my requests) |
| GET | `/api/referral-requests/alumni` | Alumni (incoming requests) |
| PATCH | `/api/referral-requests/{id}/status` | Alumni (accept/reject) |
| GET | `/api/referral-requests/{id}/resume` | Student or Alumni (download resume) |

### Mentorship Requests
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mentorship` | My requests (student or alumni) |
| POST | `/api/mentorship` | Create request (students only) |
| PATCH | `/api/mentorship/{id}/status` | Approve/reject (alumni only) |

### Chat (Stored Messages)
Chat becomes available only after a mentorship request is **approved**.
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats` | List my chat threads |
| POST | `/api/chats/from-mentorship/{mentorshipId}` | Get/create chat thread for an approved mentorship |
| GET | `/api/chats/{threadId}/messages` | List messages |
| POST | `/api/chats/{threadId}/messages` | Send message |

### Events
| Method | Endpoint | Auth Role |
|--------|----------|-----------|
| GET | `/api/events` | Any |
| POST | `/api/events` | Alumni/Admin |
| DELETE | `/api/events/{id}` | Event creator |

### Discussions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/discussions` | All posts |
| GET | `/api/discussions/{id}` | Post + replies |
| POST | `/api/discussions` | Create post |
| POST | `/api/discussions/{id}/replies` | Add reply |
| DELETE | `/api/discussions/{id}` | Delete own post |

### Success Stories
| Method | Endpoint | Auth Role |
|--------|----------|-----------|
| GET | `/api/stories` | Any |
| GET | `/api/stories/featured` | Any |
| POST | `/api/stories` | Alumni/Admin |
| PATCH | `/api/stories/{id}/featured` | Admin only |

## Frontend Integration

The frontend has been updated to use the new backend. Key changes:

1. **`src/integrations/api/client.ts`** — New HTTP API client
2. **`src/contexts/AuthContext.tsx`** — Uses JWT auth
3. **`src/hooks/useJobs.ts`** — Uses REST API
4. **`src/hooks/useMentorRequests.ts`** — Uses REST API
5. **`src/hooks/useProfiles.ts`** — Uses REST API
6. **`src/hooks/useRealtimeNotifications.ts`** — Uses polling

Set in `.env`:
```
VITE_API_BASE_URL=http://localhost:8080/api
```
