# S7 Robotics Platform Enhancement Design

## Overview

The S7 Robotics platform is a comprehensive learning management system built with Next.js 14, designed to provide educational content, team management, and achievement tracking for robotics and programming students. This enhancement expands the platform to include full user management, payment system integration, advanced authentication, and a comprehensive admin panel for content and user management.

### Current Architecture Analysis
- **Frontend**: Next.js 14 App Router with TypeScript 5, Tailwind CSS 4
- **Database**: Currently uses empty Prisma schema with SQLite dev.db 
- **Authentication**: Basic hardcoded authentication (email: "1", password: "1")
- **Admin Panel**: Static components with localStorage-based admin access
- **State Management**: React state with local component management

### Enhancement Goals
1. Implement persistent user authentication and profile management
2. Create comprehensive database schema for all platform entities
3. Build functional payment system with Kaspi integration
4. Enable full admin panel functionality for user and content management
5. Implement achievement system and course purchase workflow

## Technology Stack & Dependencies

| Component | Current | Enhanced |
|-----------|---------|----------|
| Database ORM | Prisma 6.16.1 | Maintained |
| Authentication | Hardcoded | NextAuth.js 4.24.11 + Custom JWT |
| Database Engine | SQLite (dev.db) | PostgreSQL for production, SQLite for development |
| Payment Integration | None | Kaspi Pay API integration |
| Email Service | None | Nodemailer + SMTP service |  
| File Storage | Local | AWS S3 or Cloudinary for course media |
| Real-time Features | None | WebSocket support for notifications |

## Architecture

The enhanced platform follows a layered architecture pattern optimized for scalability and maintainability:

```mermaid
graph TB
    subgraph "Client Layer"
        UI[User Interface Components]
        AUTH[Authentication Pages]
        DASH[Dashboard Tabs]
        ADMIN[Admin Panel]
    end
    
    subgraph "API Layer"
        ROUTES[Next.js API Routes]
        MIDDLE[Middleware & Interceptors]
        VALIDATORS[Request Validators]
    end
    
    subgraph "Business Logic Layer"
        USER_SVC[User Service]
        COURSE_SVC[Course Service]
        PAYMENT_SVC[Payment Service]
        ACHIEVE_SVC[Achievement Service]
        TEAM_SVC[Team Service]
    end
    
    subgraph "Data Layer"
        PRISMA[Prisma ORM]
        DATABASE[(PostgreSQL Database)]
        CACHE[(Redis Cache)]
    end
    
    subgraph "External Services"
        KASPI[Kaspi Pay API]
        EMAIL[Email Service]
        STORAGE[Media Storage]
    end
    
    UI --> ROUTES
    AUTH --> ROUTES
    DASH --> ROUTES
    ADMIN --> ROUTES
    
    ROUTES --> MIDDLE
    MIDDLE --> VALIDATORS
    VALIDATORS --> USER_SVC
    VALIDATORS --> COURSE_SVC
    VALIDATORS --> PAYMENT_SVC
    VALIDATORS --> ACHIEVE_SVC
    VALIDATORS --> TEAM_SVC
    
    USER_SVC --> PRISMA
    COURSE_SVC --> PRISMA
    PAYMENT_SVC --> PRISMA
    ACHIEVE_SVC --> PRISMA
    TEAM_SVC --> PRISMA
    
    PRISMA --> DATABASE
    ROUTES --> CACHE
    
    PAYMENT_SVC --> KASPI
    USER_SVC --> EMAIL
    COURSE_SVC --> STORAGE
```

## Data Models & Database Schema

### Core Entity Relationships

```mermaid
erDiagram
    User {
        string id PK
        string email
        string password_hash
        string full_name
        int age
        string educational_institution
        string primary_role
        int level
        int experience_points
        datetime created_at
        datetime updated_at
        boolean is_admin
        boolean email_verified
    }
    
    UserProfile {
        string id PK
        string user_id FK
        string avatar_url
        string bio
        string phone
        json social_links
        datetime last_login
    }
    
    Course {
        string id PK
        string title
        string description
        string difficulty_level
        string author_id FK
        decimal price
        boolean is_free
        boolean is_published
        string cover_image_url
        int total_modules
        int estimated_hours
        datetime created_at
        datetime updated_at
    }
    
    CourseModule {
        string id PK
        string course_id FK
        string title
        string description
        int order_index
        boolean is_locked
        datetime created_at
    }
    
    Lesson {
        string id PK
        string module_id FK
        string title
        string content_type
        text content
        string video_url
        string duration
        int order_index
        boolean is_free_preview
        datetime created_at
    }
    
    UserCourseEnrollment {
        string id PK
        string user_id FK
        string course_id FK
        datetime enrolled_at
        datetime completed_at
        decimal progress_percentage
        string status
    }
    
    UserLessonProgress {
        string id PK
        string user_id FK
        string lesson_id FK
        boolean is_completed
        int watch_time_seconds
        datetime started_at
        datetime completed_at
    }
    
    Achievement {
        string id PK
        string title
        string description
        string icon_url
        string badge_color
        string criteria_type
        json criteria_data
        boolean is_active
        datetime created_at
    }
    
    UserAchievement {
        string id PK
        string user_id FK
        string achievement_id FK
        datetime earned_at
        string awarded_by_id FK
        text admin_note
    }
    
    Team {
        string id PK
        string name
        string description
        string captain_id FK
        string logo_url
        int max_members
        boolean is_active
        datetime created_at
    }
    
    TeamMembership {
        string id PK
        string team_id FK
        string user_id FK
        string role
        datetime joined_at
        string status
    }
    
    Competition {
        string id PK
        string name
        string description
        string team_id FK
        date competition_date
        string venue
        json awards_won
        string status
        datetime created_at
    }
    
    Purchase {
        string id PK
        string user_id FK
        string course_id FK
        decimal amount
        string currency
        string payment_method
        string kaspi_transaction_id
        string status
        datetime created_at
        datetime confirmed_at
        text admin_notes
    }
    
    Notification {
        string id PK
        string user_id FK
        string title
        text message
        string type
        boolean is_read
        json metadata
        datetime created_at
    }
    
    User ||--|| UserProfile: has
    User ||--o{ Course: creates
    User ||--o{ UserCourseEnrollment: enrolls
    User ||--o{ UserLessonProgress: tracks
    User ||--o{ UserAchievement: earns
    User ||--o{ TeamMembership: joins
    User ||--o{ Purchase: makes
    User ||--o{ Notification: receives
    
    Course ||--o{ CourseModule: contains
    Course ||--o{ UserCourseEnrollment: enrolled_by
    Course ||--o{ Purchase: purchased
    
    CourseModule ||--o{ Lesson: contains
    
    Lesson ||--o{ UserLessonProgress: tracked_by
    
    Achievement ||--o{ UserAchievement: awarded_as
    
    Team ||--o{ TeamMembership: has
    Team ||--o{ Competition: participates
    
    User ||--o{ Team: captains
```

### Database Schema Configuration

| Entity | Primary Storage | Indexes | Constraints |
|--------|----------------|---------|-------------|
| User | PostgreSQL | email (unique), created_at | email format validation |
| UserProfile | PostgreSQL | user_id (unique) | FK to User |
| Course | PostgreSQL | author_id, difficulty_level, created_at | price >= 0 |
| CourseModule | PostgreSQL | course_id, order_index | order_index unique per course |
| Lesson | PostgreSQL | module_id, order_index | order_index unique per module |
| UserCourseEnrollment | PostgreSQL | user_id, course_id (composite unique) | status enum validation |
| Purchase | PostgreSQL | user_id, course_id, created_at | amount > 0 |
| Achievement | PostgreSQL | criteria_type, created_at | criteria_data JSON validation |
| Team | PostgreSQL | captain_id, created_at | max_members >= 1 |
| Notification | PostgreSQL | user_id, created_at, is_read | automatic expiry after 30 days |

## Authentication & Authorization System

### Authentication Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant LoginPage
    participant NextAuth
    participant Database
    participant Dashboard
    
    User->>LoginPage: Enter credentials
    LoginPage->>NextAuth: authenticate(email, password)
    NextAuth->>Database: verify user credentials
    Database-->>NextAuth: user data or error
    
    alt Authentication Success
        NextAuth-->>LoginPage: JWT token + user session
        LoginPage->>Dashboard: redirect with session
        Dashboard->>Database: fetch user profile
        Database-->>Dashboard: complete user data
        Dashboard-->>User: show personalized dashboard
    else Authentication Failure
        NextAuth-->>LoginPage: error message
        LoginPage-->>User: display error notification
    end
```

### Session Management Strategy

| Feature | Implementation | Duration | Storage |
|---------|---------------|----------|---------|
| JWT Tokens | NextAuth.js custom provider | 7 days | httpOnly cookies |
| Session Refresh | Automatic on API calls | 24 hours | Server-side validation |
| Remember Me | Extended JWT expiry | 30 days | Secure localStorage flag |
| Admin Sessions | Elevated permission tokens | 2 hours | Separate cookie domain |
| Password Reset | Temporary signed tokens | 15 minutes | Database temporary table |

### User Registration & Profile Setup

```mermaid
flowchart TD
    A[User submits registration] --> B{Email exists?}
    B -->|Yes| C[Show error message]
    B -->|No| D[Create user account]
    D --> E[Send verification email]
    E --> F[User verifies email]
    F --> G[Show profile setup form]
    G --> H[User fills profile data]
    H --> I{All required fields filled?}
    I -->|No| J[Show validation errors]
    I -->|Yes| K[Save profile data]
    K --> L[Calculate initial level]
    L --> M[Redirect to dashboard]
    J --> H
    C --> A
```

### Authorization Levels

| Role | Permissions | Access Areas |
|------|------------|--------------|
| Guest | View public content | Landing page, course previews |
| Registered User | View purchased courses, manage profile | Dashboard, purchased content |
| Team Captain | Manage team members, team profile | Team management section |
| Admin | Full platform management | Admin panel, all user data |
| Super Admin | System configuration, admin management | Full system access |

## Course Purchase & Payment System

### Payment Flow Architecture

```mermaid
sequenceDiagram
    participant User
    participant CoursePage
    participant PaymentAPI
    participant KaspiPay
    participant Database
    participant NotificationService
    
    User->>CoursePage: Click "Buy Course"
    CoursePage->>PaymentAPI: initiate_purchase(user_id, course_id)
    PaymentAPI->>Database: create pending purchase record
    Database-->>PaymentAPI: purchase_id
    PaymentAPI-->>CoursePage: payment details (amount, kaspi_number)
    CoursePage-->>User: show payment instructions
    
    User->>CoursePage: Click "I've sent payment"
    CoursePage->>User: Show confirmation dialog
    User->>CoursePage: Confirm payment sent
    CoursePage->>PaymentAPI: mark_payment_sent(purchase_id)
    PaymentAPI->>Database: update purchase status to "pending_confirmation"
    PaymentAPI->>NotificationService: notify_admin_payment_pending(purchase_id)
    NotificationService-->>User: show success message
    
    Note over Database, NotificationService: Admin reviews payment in admin panel
    
    PaymentAPI->>Database: admin confirms payment
    Database->>PaymentAPI: purchase confirmed
    PaymentAPI->>Database: create course enrollment
    PaymentAPI->>NotificationService: notify_user_course_available(user_id, course_id)
    NotificationService-->>User: course access granted notification
```

### Payment Integration Specifications

| Component | Implementation | Configuration |
|-----------|---------------|---------------|
| Kaspi Pay Integration | Manual verification process | Business Kaspi wallet number |
| Payment Statuses | pending → sent → confirmed → completed | Database enum type |
| Payment Confirmation | Admin manual verification | 2-hour SLA for confirmation |
| Course Access | Immediate upon admin confirmation | Automatic enrollment creation |
| Payment Records | Full audit trail maintained | 7-year retention policy |

### Purchase Workflow States

```mermaid
stateDiagram-v2
    [*] --> InitiatePurchase
    InitiatePurchase --> PaymentPending: User clicks "Buy Course"
    PaymentPending --> PaymentSent: User confirms payment sent
    PaymentSent --> PaymentConfirmed: Admin verifies payment
    PaymentSent --> PaymentRejected: Admin rejects payment
    PaymentConfirmed --> CourseAccess: Enrollment created
    PaymentRejected --> PaymentPending: User can retry
    CourseAccess --> [*]
```

## Admin Panel Functionality

### Admin Dashboard Architecture

```mermaid
graph TB
    subgraph "Admin Dashboard"
        OVERVIEW[Dashboard Overview]
        USER_MGMT[User Management]
        COURSE_MGMT[Course Management]
        PAYMENT_MGMT[Payment Management]
        ACHIEVE_MGMT[Achievement Management]
        TEAM_MGMT[Team Management]
        ANALYTICS[Analytics & Reports]
    end
    
    subgraph "User Management Functions"
        USER_LIST[View All Users]
        USER_EDIT[Edit User Profiles]
        USER_ACHIEVE[Award Achievements]
        USER_ENROLL[Manual Course Enrollment]
        USER_BAN[User Status Management]
    end
    
    subgraph "Course Management Functions"
        COURSE_CREATE[Create Courses]
        COURSE_EDIT[Edit Course Content]
        MODULE_MGMT[Manage Modules & Lessons]
        COURSE_PUBLISH[Publish/Unpublish Courses]
    end
    
    subgraph "Payment Management Functions"
        PAYMENT_QUEUE[Pending Payments Queue]
        PAYMENT_VERIFY[Verify Payments]
        PAYMENT_HISTORY[Payment History]
        REFUND_MGMT[Refund Management]
    end
    
    OVERVIEW --> USER_MGMT
    OVERVIEW --> COURSE_MGMT
    OVERVIEW --> PAYMENT_MGMT
    OVERVIEW --> ACHIEVE_MGMT
    OVERVIEW --> TEAM_MGMT
    OVERVIEW --> ANALYTICS
    
    USER_MGMT --> USER_LIST
    USER_MGMT --> USER_EDIT
    USER_MGMT --> USER_ACHIEVE
    USER_MGMT --> USER_ENROLL
    USER_MGMT --> USER_BAN
    
    COURSE_MGMT --> COURSE_CREATE
    COURSE_MGMT --> COURSE_EDIT
    COURSE_MGMT --> MODULE_MGMT
    COURSE_MGMT --> COURSE_PUBLISH
    
    PAYMENT_MGMT --> PAYMENT_QUEUE
    PAYMENT_MGMT --> PAYMENT_VERIFY
    PAYMENT_MGMT --> PAYMENT_HISTORY
    PAYMENT_MGMT --> REFUND_MGMT
```

### Admin Panel Features Specification

| Feature | Description | Functionality |
|---------|-------------|---------------|
| User Registry | Complete user database view | Search, filter, edit profiles, view purchase history |
| Achievement System | Award management interface | Create custom achievements, bulk award, track user progress |
| Course Assignment | Direct course enrollment | Bypass payment for promotional access |
| Payment Verification | Kaspi payment confirmation | View payment screenshots, confirm/reject, add notes |
| Analytics Dashboard | Platform usage statistics | User growth, course popularity, revenue tracking |
| Team Management | Team creation and oversight | Approve team formations, manage competitions |
| Content Moderation | Review user-generated content | Approve team profiles, competition results |

### Admin Workflow: Achievement Award Process

```mermaid
flowchart TD
    A[Admin selects user] --> B[Choose achievement type]
    B --> C{Custom achievement?}
    C -->|Yes| D[Create custom achievement]
    C -->|No| E[Select from existing achievements]
    D --> F[Fill achievement details]
    E --> F
    F --> G[Add admin note]
    G --> H[Award achievement]
    H --> I[Update user experience points]
    I --> J[Send notification to user]
    J --> K[Log admin action]
```

## Achievement System

### Achievement Categories & Criteria

| Category | Achievement Types | Criteria | Points Awarded |
|----------|------------------|----------|----------------|
| Learning | Course Completion | Complete any paid course | 500 XP |
| Learning | Perfect Score | Score 100% on course quiz | 200 XP |
| Learning | Learning Streak | Complete lessons 7 days in a row | 300 XP |
| Competition | First Competition | Participate in first competition | 400 XP |
| Competition | Award Winner | Win any competition award | 800 XP |
| Competition | Team Captain | Lead a team for 6 months | 600 XP |
| Social | Referral | Refer 5 new users who complete registration | 1000 XP |
| Social | Community Helper | Help other users in forums | 100 XP per help |
| Platform | Early Adopter | Register in first 1000 users | 1500 XP |
| Custom | Admin Awarded | Manually awarded by administrators | Variable |

### Level Progression System

```mermaid
graph TD
    A[Level 1: 0 XP] --> B[Level 2: 1000 XP]
    B --> C[Level 3: 2500 XP]
    C --> D[Level 4: 4500 XP]
    D --> E[Level 5: 7000 XP]
    E --> F[Level 6: 10000 XP]
    F --> G[Level 7: 13500 XP]
    G --> H[Level 8: 17500 XP]
    H --> I[Level 9: 22000 XP]
    I --> J[Level 10: 27000 XP]
    J --> K[Level 11: 32500 XP]
    K --> L[Level 12: 40000 XP]
    L --> M[Level 13+: +10000 XP per level]
```

### Achievement Notification System

```mermaid
sequenceDiagram
    participant System
    participant AchievementService
    participant User
    participant NotificationService
    participant Database
    
    System->>AchievementService: trigger_achievement_check(user_id, action)
    AchievementService->>Database: check achievement criteria
    Database-->>AchievementService: eligible achievements
    
    loop For each eligible achievement
        AchievementService->>Database: award achievement
        AchievementService->>AchievementService: calculate XP bonus
        AchievementService->>Database: update user XP and level
        AchievementService->>NotificationService: create achievement notification
    end
    
    NotificationService-->>User: display achievement popup
    NotificationService->>Database: log notification
```

## Team Management System

### Team Formation & Management

| Feature | Description | Implementation |
|---------|-------------|---------------|
| Team Creation | Users can create teams | Captain role automatically assigned to creator |
| Member Invitation | Captains invite users via email/username | Invitation system with accept/decline |
| Role Management | Captain, Co-Captain, Member roles | Different permission levels per role |
| Team Profile | Public team information page | Logo, description, member list, achievements |
| Competition Registration | Teams register for competitions | Admin approval required |
| Team Statistics | Performance tracking | Win/loss records, member progress |

### Team Roles & Permissions

| Role | Permissions | Limitations |
|------|-------------|-------------|
| Captain | Invite/remove members, edit team profile, register for competitions | Cannot remove self, must transfer captaincy |
| Co-Captain | Invite members, edit team profile | Cannot remove captain or other co-captains |
| Member | View team information, participate in team activities | Cannot modify team settings |

## API Endpoints Reference

### Authentication Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/auth/login` | POST | User login | `{email, password}` | `{user, token, expires}` |
| `/api/auth/register` | POST | User registration | `{email, password, fullName}` | `{success, userId}` |
| `/api/auth/verify-email` | GET | Email verification | `?token=xxx` | `{success, message}` |
| `/api/auth/reset-password` | POST | Password reset request | `{email}` | `{success, message}` |
| `/api/auth/logout` | POST | User logout | `{}` | `{success}` |

### User Management Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/users/profile` | GET | Get user profile | N/A | `{user, profile, achievements}` |
| `/api/users/profile` | PUT | Update user profile | `{fullName, age, institution, role}` | `{success, user}` |
| `/api/users/achievements` | GET | Get user achievements | N/A | `{achievements, totalXP, level}` |
| `/api/users/courses` | GET | Get enrolled courses | N/A | `{courses, progress}` |
| `/api/users/teams` | GET | Get user teams | N/A | `{teams, role}` |

### Course Management Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/courses` | GET | List all courses | `?search=&difficulty=&page=` | `{courses, pagination}` |
| `/api/courses/:id` | GET | Get course details | N/A | `{course, modules, lessons}` |
| `/api/courses/:id/enroll` | POST | Enroll in free course | `{}` | `{success, enrollment}` |
| `/api/courses/:id/purchase` | POST | Purchase course | `{}` | `{purchaseId, paymentDetails}` |
| `/api/courses/:id/progress` | GET | Get course progress | N/A | `{progress, completedLessons}` |
| `/api/courses/:id/lessons/:lessonId/complete` | POST | Mark lesson complete | `{}` | `{success, newProgress}` |

### Payment Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/payments/:id/confirm-sent` | POST | User confirms payment sent | `{}` | `{success, status}` |
| `/api/payments/history` | GET | User payment history | N/A | `{payments, pagination}` |

### Admin Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/admin/users` | GET | List all users | `?search=&page=` | `{users, pagination}` |
| `/api/admin/users/:id` | PUT | Update user | `{profile, achievements}` | `{success, user}` |
| `/api/admin/users/:id/achievements` | POST | Award achievement | `{achievementId, note}` | `{success, achievement}` |
| `/api/admin/payments/pending` | GET | Pending payments | N/A | `{payments, count}` |
| `/api/admin/payments/:id/verify` | POST | Verify payment | `{status, notes}` | `{success, payment}` |
| `/api/admin/courses` | POST | Create course | `{title, description, price}` | `{success, courseId}` |
| `/api/admin/courses/:id` | PUT | Update course | `{course data}` | `{success, course}` |
| `/api/admin/achievements` | POST | Create achievement | `{title, description, criteria}` | `{success, achievementId}` |

### Team Management Endpoints

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/teams` | POST | Create team | `{name, description}` | `{success, teamId}` |
| `/api/teams/:id` | GET | Get team details | N/A | `{team, members, competitions}` |
| `/api/teams/:id/invite` | POST | Invite member | `{userId}` | `{success, invitation}` |
| `/api/teams/:id/members/:userId` | DELETE | Remove member | N/A | `{success}` |
| `/api/teams/:id/competitions` | POST | Add competition | `{name, date, awards}` | `{success, competitionId}` |

## Middleware & Interceptors

### Authentication Middleware
Protects routes requiring user authentication and provides user context to API handlers.

```mermaid
flowchart TD
    A[Incoming Request] --> B{Has valid JWT token?}
    B -->|No| C[Return 401 Unauthorized]
    B -->|Yes| D{Token expired?}
    D -->|Yes| E[Attempt token refresh]
    E --> F{Refresh successful?}
    F -->|No| G[Return 401 Unauthorized]
    F -->|Yes| H[Set new token in response]
    D -->|No| I[Extract user from token]
    H --> I
    I --> J[Add user to request context]
    J --> K[Continue to API handler]
```

### Admin Authorization Middleware
Verifies admin privileges for admin panel endpoints.

| Check | Implementation | Fallback |
|-------|---------------|----------|
| User authentication | JWT token validation | Redirect to login |
| Admin role verification | User.is_admin === true | Return 403 Forbidden |
| Session freshness | Admin session < 2 hours | Re-authenticate |
| Action logging | Log all admin actions | System audit trail |

### Rate Limiting Middleware
Prevents abuse and ensures fair resource usage.

| Endpoint Type | Rate Limit | Window | Implementation |
|---------------|------------|--------|-----------------|
| Authentication | 5 attempts | 15 minutes | IP-based limiting |
| API calls | 100 requests | 1 minute | User-based limiting |
| File uploads | 10 uploads | 1 hour | User + file size limiting |
| Payment confirmations | 3 attempts | 5 minutes | User-based limiting |

## Business Logic Layer

### User Service Architecture
Centralized user management with comprehensive profile and achievement handling.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `createUser(userData)` | Create new user account with profile | Database, Email Service |
| `authenticateUser(email, password)` | Validate credentials and return session | Database, JWT Service |
| `updateProfile(userId, profileData)` | Update user profile information | Database, Validation Service |
| `calculateLevel(userId)` | Calculate user level based on XP | Database, Achievement Service |
| `awardAchievement(userId, achievementId)` | Award achievement and calculate XP | Database, Notification Service |

### Course Service Architecture
Manages course content, enrollment, and progress tracking.

| Function | Description | Dependencies |
|----------|-------------|--------------|
| `getCourseWithProgress(courseId, userId)` | Get course details with user progress | Database |
| `enrollUser(userId, courseId)` | Enroll user in course | Database, Notification Service |
| `updateLessonProgress(userId, lessonId)` | Track lesson completion | Database, Achievement Service |
| `calculateCourseProgress(userId, courseId)` | Calculate completion percentage | Database |
| `checkCourseAccess(userId, courseId)` | Verify user has access to course | Database, Payment Service |

### Payment Service Architecture
Handles course purchases and payment verification workflow.

```mermaid
flowchart TD
    A[User initiates purchase] --> B[Create purchase record]
    B --> C[Generate payment instructions]
    C --> D[Display Kaspi payment details]
    D --> E[User confirms payment sent]
    E --> F[Update status to 'pending_confirmation']
    F --> G[Notify admin of pending payment]
    G --> H[Admin reviews payment]
    H --> I{Payment verified?}
    I -->|Yes| J[Confirm payment]
    I -->|No| K[Reject payment]
    J --> L[Create course enrollment]
    L --> M[Notify user of course access]
    K --> N[Notify user of rejection]
    N --> O[Allow payment retry]
```

### Achievement Service Architecture
Automates achievement detection and award distribution.

| Trigger Event | Achievements Checked | Auto-Award Criteria |
|---------------|---------------------|---------------------|
| Course completion | Learning achievements | Course finished + quiz passed |
| Lesson completion | Streak achievements | Daily lesson completion |
| Competition entry | Competition achievements | First competition participation |
| Team creation | Leadership achievements | Team captaincy role |
| User referral | Social achievements | Referred user completes profile |
| Admin action | Custom achievements | Manual admin award |

## State Management

### Client-Side State Architecture
Optimized state management for responsive user experience.

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated
    Unauthenticated --> Authenticating: login attempt
    Authenticating --> Authenticated: success
    Authenticating --> Unauthenticated: failure
    Authenticated --> LoadingProfile: fetch user data
    LoadingProfile --> ProfileLoaded: data received
    ProfileLoaded --> Authenticated: profile updated
    Authenticated --> Unauthenticated: logout
```

### Global State Management

| State Slice | Managed Data | Update Triggers |
|-------------|--------------|----------------|
| Authentication | User session, tokens, permissions | Login, logout, token refresh |
| User Profile | Personal info, achievements, level | Profile updates, XP changes |
| Course Progress | Enrolled courses, lesson progress | Lesson completion, enrollment |
| Notifications | System messages, achievements | Real-time events, admin actions |
| Admin Panel | User lists, payment queue, analytics | Admin actions, periodic refresh |

### Local Storage Strategy

| Data Type | Storage Method | Persistence Duration | Purpose |
|-----------|----------------|---------------------|----------|
| User preferences | localStorage | Permanent | Theme, language, settings |
| Session tokens | httpOnly cookies | 7 days | Authentication |
| Course progress cache | sessionStorage | Browser session | Performance optimization |
| Admin credentials | Secure localStorage | 2 hours | Admin panel access |

## Testing Strategy

### Unit Testing Framework
Comprehensive testing coverage for business logic and utility functions.

| Component | Testing Framework | Coverage Target | Test Types |
|-----------|------------------|-----------------|------------|
| API Routes | Jest + Supertest | 90%+ | Integration, error handling |
| Database Models | Jest + Prisma Test Environment | 95%+ | CRUD operations, relationships |
| Authentication | Jest + Mock JWT | 100% | Token validation, session management |
| Payment Logic | Jest + Mock APIs | 95%+ | Payment flow, status transitions |
| Achievement System | Jest + Test Database | 90%+ | Criteria evaluation, XP calculation |

### Integration Testing
End-to-end testing of critical user workflows.

```mermaid
flowchart TD
    A[User Registration Test] --> B[Profile Setup Test]
    B --> C[Course Purchase Test]
    C --> D[Payment Confirmation Test]
    D --> E[Course Access Test]
    E --> F[Progress Tracking Test]
    F --> G[Achievement Award Test]
    G --> H[Team Creation Test]
    H --> I[Admin Panel Test]
```

### Test Data Management

| Test Environment | Database | User Accounts | Course Content |
|------------------|----------|---------------|----------------|
| Development | SQLite with seed data | 10 test users | 5 sample courses |
| Testing | In-memory database | Generated per test | Mock course data |
| Staging | PostgreSQL replica | Production-like data | Sanitized content |

## Security Considerations

### Data Protection Measures

| Security Layer | Implementation | Protection Level |
|----------------|---------------|------------------|
| Password Security | bcrypt hashing with salt rounds = 12 | High |
| JWT Security | RS256 algorithm with rotation | High |
| Database Security | Parameterized queries, input validation | High |
| Admin Access | Multi-factor authentication | Critical |
| Payment Data | PCI-DSS compliance, encrypted storage | Critical |
| File Uploads | Virus scanning, type validation | Medium |

### API Security Implementation

| Vulnerability | Mitigation Strategy | Implementation |
|---------------|-------------------|----------------|
| SQL Injection | Prisma ORM with parameterized queries | Automated |
| XSS Attacks | Input sanitization, CSP headers | Manual validation |
| CSRF Attacks | CSRF tokens, SameSite cookies | NextAuth.js built-in |
| Rate Limiting | IP and user-based throttling | Custom middleware |
| Data Validation | Zod schema validation | API route level |

### Privacy & GDPR Compliance

| Data Type | Collection Basis | Retention Period | User Rights |
|-----------|-----------------|------------------|-------------|
| Personal Information | User consent | Account lifetime | Access, rectification, deletion |
| Course Progress | Legitimate interest | 2 years post-completion | Access, portability |
| Payment Records | Legal obligation | 7 years | Access only |
| Achievement Data | User consent | Account lifetime | Access, deletion |
| Analytics Data | Anonymous aggregation | 2 years | N/A |