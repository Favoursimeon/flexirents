# FlexiRents — .NET 8 Backend Development Roadmap

> **Note**: FlexiRents currently runs on Lovable Cloud (serverless PostgreSQL + Deno edge functions). This roadmap outlines a migration/rebuild path to a self-hosted .NET 8 (C#) backend with PostgreSQL.

---

## Table of Contents

1. [Project Architecture](#1-project-architecture)
2. [Core Technologies](#2-core-technologies)
3. [Core Backend Modules](#3-core-backend-modules)
4. [Development Phases](#4-development-phases)
5. [Security Considerations](#5-security-considerations)
6. [Deployment Plan](#6-deployment-plan)
7. [Estimated Timeline](#7-estimated-timeline)
8. [Project Tracker](#8-project-tracker)
9. [Sprint Organization](#9-sprint-organization)

---

## 1. Project Architecture

### Architecture Pattern: Clean Architecture (Modular Monolith)

```
FlexiRents.sln
│
├── src/
│   ├── FlexiRents.API/                    # Presentation Layer
│   │   ├── Controllers/
│   │   │   ├── AuthController.cs
│   │   │   ├── UsersController.cs
│   │   │   ├── PropertiesController.cs
│   │   │   ├── BookingsController.cs
│   │   │   ├── PaymentsController.cs
│   │   │   ├── NotificationsController.cs
│   │   │   ├── AdminController.cs
│   │   │   └── DocumentsController.cs
│   │   ├── Middleware/
│   │   │   ├── ExceptionHandlingMiddleware.cs
│   │   │   ├── RateLimitingMiddleware.cs
│   │   │   ├── RequestLoggingMiddleware.cs
│   │   │   └── CorrelationIdMiddleware.cs
│   │   ├── Filters/
│   │   │   ├── ValidationFilter.cs
│   │   │   └── AuthorizationFilter.cs
│   │   ├── Extensions/
│   │   │   ├── ServiceCollectionExtensions.cs
│   │   │   └── ApplicationBuilderExtensions.cs
│   │   ├── Program.cs
│   │   ├── appsettings.json
│   │   └── Dockerfile
│   │
│   ├── FlexiRents.Application/            # Application Layer
│   │   ├── Common/
│   │   │   ├── Interfaces/
│   │   │   │   ├── IUnitOfWork.cs
│   │   │   │   ├── ICurrentUserService.cs
│   │   │   │   ├── IEmailService.cs
│   │   │   │   ├── IPaymentGateway.cs
│   │   │   │   ├── INotificationService.cs
│   │   │   │   ├── ICacheService.cs
│   │   │   │   └── IFileStorageService.cs
│   │   │   ├── Behaviours/
│   │   │   │   ├── ValidationBehaviour.cs
│   │   │   │   ├── LoggingBehaviour.cs
│   │   │   │   └── CachingBehaviour.cs
│   │   │   ├── Mappings/
│   │   │   │   └── MappingProfile.cs
│   │   │   └── Models/
│   │   │       ├── PaginatedList.cs
│   │   │       └── Result.cs
│   │   ├── Auth/
│   │   │   ├── Commands/
│   │   │   │   ├── RegisterCommand.cs
│   │   │   │   ├── LoginCommand.cs
│   │   │   │   ├── RefreshTokenCommand.cs
│   │   │   │   └── ResetPasswordCommand.cs
│   │   │   ├── Queries/
│   │   │   │   └── GetCurrentUserQuery.cs
│   │   │   └── DTOs/
│   │   │       ├── AuthResponseDto.cs
│   │   │       └── TokenDto.cs
│   │   ├── Users/
│   │   │   ├── Commands/
│   │   │   │   ├── UpdateProfileCommand.cs
│   │   │   │   ├── UploadAvatarCommand.cs
│   │   │   │   ├── UpdateEmergencyContactCommand.cs
│   │   │   │   └── DeleteAccountCommand.cs
│   │   │   ├── Queries/
│   │   │   │   ├── GetProfileQuery.cs
│   │   │   │   └── GetUserVerificationQuery.cs
│   │   │   └── DTOs/
│   │   │       ├── ProfileDto.cs
│   │   │       └── VerificationDto.cs
│   │   ├── Properties/
│   │   │   ├── Commands/
│   │   │   │   ├── CreatePropertyCommand.cs
│   │   │   │   ├── UpdatePropertyCommand.cs
│   │   │   │   ├── DeletePropertyCommand.cs
│   │   │   │   └── ApprovePropertyCommand.cs
│   │   │   ├── Queries/
│   │   │   │   ├── GetPropertiesQuery.cs
│   │   │   │   ├── GetPropertyByIdQuery.cs
│   │   │   │   ├── SearchPropertiesQuery.cs
│   │   │   │   └── GetMyPropertiesQuery.cs
│   │   │   └── DTOs/
│   │   │       ├── PropertyDto.cs
│   │   │       ├── PropertyListDto.cs
│   │   │       └── PropertyFilterDto.cs
│   │   ├── Bookings/
│   │   │   ├── Commands/
│   │   │   │   ├── CreateBookingCommand.cs
│   │   │   │   ├── UpdateBookingStatusCommand.cs
│   │   │   │   ├── CancelBookingCommand.cs
│   │   │   │   └── CreateViewingScheduleCommand.cs
│   │   │   ├── Queries/
│   │   │   │   ├── GetBookingsQuery.cs
│   │   │   │   └── GetBookingByIdQuery.cs
│   │   │   └── DTOs/
│   │   │       └── BookingDto.cs
│   │   ├── Payments/
│   │   │   ├── Commands/
│   │   │   │   ├── InitiatePaymentCommand.cs
│   │   │   │   ├── VerifyPaymentCommand.cs
│   │   │   │   ├── ProcessWebhookCommand.cs
│   │   │   │   └── CreatePaymentScheduleCommand.cs
│   │   │   ├── Queries/
│   │   │   │   ├── GetPaymentHistoryQuery.cs
│   │   │   │   └── GetPaymentScheduleQuery.cs
│   │   │   └── DTOs/
│   │   │       ├── PaymentDto.cs
│   │   │       └── PaymentScheduleDto.cs
│   │   ├── Notifications/
│   │   │   ├── Commands/
│   │   │   │   ├── SendNotificationCommand.cs
│   │   │   │   ├── MarkNotificationReadCommand.cs
│   │   │   │   └── UpdateReminderSettingsCommand.cs
│   │   │   ├── Queries/
│   │   │   │   └── GetNotificationsQuery.cs
│   │   │   └── DTOs/
│   │   │       └── NotificationDto.cs
│   │   ├── Leases/
│   │   │   ├── Commands/
│   │   │   │   ├── CreateLeaseCommand.cs
│   │   │   │   ├── RenewLeaseCommand.cs
│   │   │   │   └── TerminateLeaseCommand.cs
│   │   │   └── Queries/
│   │   │       └── GetLeaseQuery.cs
│   │   └── Admin/
│   │       ├── Commands/
│   │       │   ├── ApproveVendorCommand.cs
│   │       │   ├── ApproveServiceProviderCommand.cs
│   │       │   ├── ManageUserCommand.cs
│   │       │   └── UpdateCurrencyRateCommand.cs
│   │       └── Queries/
│   │           ├── GetDashboardStatsQuery.cs
│   │           ├── GetAnalyticsQuery.cs
│   │           └── GetFinancialReportsQuery.cs
│   │
│   ├── FlexiRents.Domain/                 # Domain Layer
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   ├── Profile.cs
│   │   │   ├── UserRole.cs
│   │   │   ├── UserVerification.cs
│   │   │   ├── Property.cs
│   │   │   ├── Booking.cs
│   │   │   ├── BookingRequest.cs
│   │   │   ├── RentalLease.cs
│   │   │   ├── RentalPayment.cs
│   │   │   ├── RecurringPaymentSchedule.cs
│   │   │   ├── PaymentAccount.cs
│   │   │   ├── Review.cs
│   │   │   ├── ReviewVote.cs
│   │   │   ├── Message.cs
│   │   │   ├── Document.cs
│   │   │   ├── DocumentVersion.cs
│   │   │   ├── DocumentShare.cs
│   │   │   ├── DocumentFolder.cs
│   │   │   ├── ServiceProviderRegistration.cs
│   │   │   ├── VendorRegistration.cs
│   │   │   ├── VendorProduct.cs
│   │   │   ├── PortfolioImage.cs
│   │   │   ├── ProviderAvailability.cs
│   │   │   ├── FinancialAssessment.cs
│   │   │   ├── FlexiScoreHistory.cs
│   │   │   ├── ViewingSchedule.cs
│   │   │   ├── Wishlist.cs
│   │   │   ├── UserPreferences.cs
│   │   │   ├── CurrencyRate.cs
│   │   │   ├── SubscriptionPlan.cs
│   │   │   ├── UserSubscription.cs
│   │   │   ├── NewsletterSubscription.cs
│   │   │   ├── PageVisit.cs
│   │   │   ├── PushSubscription.cs
│   │   │   └── AccountDeletionRequest.cs
│   │   ├── Enums/
│   │   │   ├── AppRole.cs
│   │   │   ├── PropertyStatus.cs
│   │   │   ├── BookingStatus.cs
│   │   │   ├── PaymentStatus.cs
│   │   │   ├── LeaseStatus.cs
│   │   │   └── VerificationStatus.cs
│   │   ├── ValueObjects/
│   │   │   ├── Money.cs
│   │   │   ├── Address.cs
│   │   │   └── DateRange.cs
│   │   ├── Events/
│   │   │   ├── PropertyCreatedEvent.cs
│   │   │   ├── BookingConfirmedEvent.cs
│   │   │   ├── PaymentReceivedEvent.cs
│   │   │   └── LeaseExpiredEvent.cs
│   │   └── Common/
│   │       ├── BaseEntity.cs
│   │       ├── AuditableEntity.cs
│   │       └── IDomainEvent.cs
│   │
│   └── FlexiRents.Infrastructure/         # Infrastructure Layer
│       ├── Persistence/
│       │   ├── FlexiRentsDbContext.cs
│       │   ├── Configurations/
│       │   │   ├── UserConfiguration.cs
│       │   │   ├── PropertyConfiguration.cs
│       │   │   ├── BookingConfiguration.cs
│       │   │   ├── PaymentConfiguration.cs
│       │   │   └── LeaseConfiguration.cs
│       │   ├── Migrations/
│       │   ├── Repositories/
│       │   │   ├── PropertyRepository.cs
│       │   │   ├── BookingRepository.cs
│       │   │   ├── PaymentRepository.cs
│       │   │   └── UserRepository.cs
│       │   ├── UnitOfWork.cs
│       │   └── Interceptors/
│       │       └── AuditableEntityInterceptor.cs
│       ├── Identity/
│       │   ├── JwtTokenService.cs
│       │   ├── CurrentUserService.cs
│       │   └── IdentityService.cs
│       ├── Services/
│       │   ├── EmailService.cs
│       │   ├── PaystackPaymentGateway.cs
│       │   ├── NotificationService.cs
│       │   ├── PushNotificationService.cs
│       │   ├── FileStorageService.cs
│       │   └── FlexiScoreService.cs
│       ├── Caching/
│       │   ├── RedisCacheService.cs
│       │   └── CacheKeyConstants.cs
│       └── DependencyInjection.cs
│
├── tests/
│   ├── FlexiRents.UnitTests/
│   │   ├── Domain/
│   │   ├── Application/
│   │   └── FlexiRents.UnitTests.csproj
│   ├── FlexiRents.IntegrationTests/
│   │   ├── Controllers/
│   │   ├── Repositories/
│   │   └── FlexiRents.IntegrationTests.csproj
│   └── FlexiRents.ArchitectureTests/
│       └── FlexiRents.ArchitectureTests.csproj
│
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── nginx/
│       └── nginx.conf
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── cd-staging.yml
│       └── cd-production.yml
│
├── docs/
│   ├── api-specification.md
│   ├── database-schema.md
│   └── deployment-guide.md
│
├── FlexiRents.sln
├── .editorconfig
├── .gitignore
├── Directory.Build.props
└── README.md
```

### Architecture Principles

| Principle | Description |
|-----------|-------------|
| **Dependency Inversion** | Inner layers never depend on outer layers |
| **CQRS** | Separate command and query models via MediatR |
| **Repository Pattern** | Abstract data access behind interfaces |
| **Unit of Work** | Coordinate multiple repository operations |
| **Domain Events** | Decouple side effects from core logic |
| **Result Pattern** | Explicit error handling without exceptions |

---

## 2. Core Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **.NET 8** | Web API framework | 8.0 LTS |
| **Entity Framework Core** | ORM / data access | 8.x |
| **PostgreSQL** | Primary database | 16.x |
| **Redis** | Distributed caching & sessions | 7.x |
| **MediatR** | CQRS & mediator pattern | 12.x |
| **FluentValidation** | Request validation | 11.x |
| **AutoMapper** | Object mapping | 13.x |
| **Serilog** | Structured logging | 3.x |
| **JWT Bearer** | Token authentication | Built-in |
| **Swagger / Scalar** | API documentation | OpenAPI 3.0 |
| **Docker** | Containerization | Latest |
| **xUnit** | Testing framework | Latest |
| **FluentAssertions** | Test assertions | Latest |
| **Testcontainers** | Integration test DB | Latest |
| **Paystack .NET SDK** | Payment processing | Latest |
| **SignalR** | Real-time messaging | Built-in |
| **Hangfire** | Background job processing | Latest |
| **Npgsql** | PostgreSQL driver | 8.x |

---

## 3. Core Backend Modules

### Module 1: Authentication & Authorization
- Email/password registration and login
- JWT access + refresh token flow
- Role-based access control (User, Admin, Moderator, Service Provider, Vendor)
- Password reset via email
- Account deletion requests
- Session management

### Module 2: User Profiles
- Profile CRUD (name, phone, avatar)
- Emergency contact management
- User verification (ID upload, employment, address)
- Privacy settings (online status, search engine visibility)
- FlexiScore / financial assessment
- Preferences and notification settings

### Module 3: Property Listing Management
- Property CRUD with multi-image upload
- Admin approval workflow (pending → approved / rejected)
- Property types: rental, sale, commercial, land
- Regions and locations (Ghana-specific)
- Lease duration configuration
- Owner property management dashboard

### Module 4: Property Search & Filters
- Full-text search with PostgreSQL `tsvector`
- Filter by: region, location, type, price range, bedrooms, bathrooms
- Sort by: price, date, popularity
- Pagination with cursor-based or offset
- Cached search results via Redis

### Module 5: Booking & Reservations
- Viewing schedule creation
- Booking requests with status workflow
- Service provider booking (with availability calendar)
- Custom time request handling
- Booking messaging system (real-time via SignalR)

### Module 6: Rental & Lease Management
- Lease creation with payment schedule generation
- Lease renewal workflow
- Automatic lease expiry detection (Hangfire job)
- Payment tracking per lease
- Billing history and export

### Module 7: Payments Integration
- Paystack payment initiation and verification
- Webhook processing for payment confirmation
- Recurring payment schedules
- Payment account management (bank accounts)
- Payment history with export (CSV/PDF)
- Admin payment approval workflow

### Module 8: Notifications System
- In-app notifications (database-backed)
- Push notifications (Web Push API)
- Email notifications (transactional)
- Payment reminders (Hangfire scheduled)
- Property match alerts based on user preferences
- Real-time notifications via SignalR

### Module 9: Admin Dashboard APIs
- Dashboard statistics (users, properties, bookings, revenue)
- User management (view, suspend, delete)
- Property moderation (approve, reject)
- Vendor and service provider approval
- Financial reports and analytics
- Currency rate management
- Review moderation
- Verification management
- Page visit analytics

### Module 10: Marketplace
- Vendor registration and approval
- Product CRUD with images
- Service provider registration and approval
- Portfolio management
- Subscription plans and billing
- Reviews and ratings system

### Module 11: Document Management
- Document upload and storage
- Folder organization
- Version history tracking
- Document sharing (link-based and email-based)
- Access control and expiry

---

## 4. Development Phases

### Phase 1: Project Setup & Architecture
**Duration: 1–2 weeks**

| # | Task | Deliverable |
|---|------|-------------|
| 1.1 | Create .NET 8 solution with Clean Architecture | Solution structure |
| 1.2 | Configure PostgreSQL with EF Core | DbContext + connection |
| 1.3 | Set up Docker Compose (API + PostgreSQL + Redis) | docker-compose.yml |
| 1.4 | Configure Serilog structured logging | Logging pipeline |
| 1.5 | Set up MediatR + FluentValidation + AutoMapper | Pipeline behaviours |
| 1.6 | Configure Swagger / Scalar API docs | /swagger endpoint |
| 1.7 | Set up GitHub Actions CI pipeline | Build + test on PR |
| 1.8 | Create base entities and common abstractions | Domain layer foundation |
| 1.9 | Configure health checks | /health endpoint |
| 1.10 | Set up environment-based configuration | appsettings.{env}.json |

**Milestone**: API boots, connects to PostgreSQL, returns health check ✅

---

### Phase 2: Authentication & User Management
**Duration: 2–3 weeks**

| # | Task | Deliverable |
|---|------|-------------|
| 2.1 | Create User, Profile, UserRole entities + EF config | Database tables |
| 2.2 | Implement JWT token generation + refresh tokens | JwtTokenService |
| 2.3 | Build RegisterCommand with email validation | POST /api/auth/register |
| 2.4 | Build LoginCommand with password hashing (BCrypt) | POST /api/auth/login |
| 2.5 | Implement refresh token rotation | POST /api/auth/refresh |
| 2.6 | Build password reset flow | POST /api/auth/reset-password |
| 2.7 | Implement role-based authorization policies | [Authorize(Roles)] |
| 2.8 | Build profile CRUD endpoints | GET/PUT /api/users/profile |
| 2.9 | Implement avatar upload to cloud storage | PUT /api/users/avatar |
| 2.10 | Build emergency contact management | PUT /api/users/emergency-contact |
| 2.11 | Implement user verification submission | POST /api/users/verification |
| 2.12 | Build account deletion request flow | POST /api/users/delete-request |
| 2.13 | Seed admin user and roles | Migration seed data |

**Milestone**: Users can register, login, manage profiles, request verification ✅

---

### Phase 3: Property Listing System
**Duration: 2–3 weeks**

| # | Task | Deliverable |
|---|------|-------------|
| 3.1 | Create Property entity with EF configuration | Database table |
| 3.2 | Build property creation with image upload | POST /api/properties |
| 3.3 | Implement property update and delete | PUT/DELETE /api/properties/{id} |
| 3.4 | Build property listing with pagination | GET /api/properties |
| 3.5 | Implement advanced search with filters | GET /api/properties/search |
| 3.6 | Add PostgreSQL full-text search (tsvector) | Search index |
| 3.7 | Build "My Properties" for owners | GET /api/properties/mine |
| 3.8 | Implement admin approval workflow | PUT /api/admin/properties/{id}/approve |
| 3.9 | Build property details endpoint | GET /api/properties/{id} |
| 3.10 | Implement wishlist functionality | POST/DELETE /api/wishlist |
| 3.11 | Add Redis caching for property queries | Cache layer |
| 3.12 | Build user property preferences | PUT /api/users/preferences |

**Milestone**: Properties can be listed, searched, filtered, and managed ✅

---

### Phase 4: Booking System
**Duration: 2 weeks**

| # | Task | Deliverable |
|---|------|-------------|
| 4.1 | Create Booking, BookingRequest, ViewingSchedule entities | Database tables |
| 4.2 | Build viewing schedule creation | POST /api/viewings |
| 4.3 | Implement service provider booking flow | POST /api/bookings |
| 4.4 | Build booking request workflow (request → accept/reject) | Status management |
| 4.5 | Implement provider availability calendar | GET/PUT /api/providers/availability |
| 4.6 | Build booking messaging with SignalR | Real-time chat |
| 4.7 | Implement booking cancellation | PUT /api/bookings/{id}/cancel |
| 4.8 | Build booking history queries | GET /api/bookings |

**Milestone**: Users can schedule viewings, book services, and communicate ✅

---

### Phase 5: Payment Integration
**Duration: 2–3 weeks**

| # | Task | Deliverable |
|---|------|-------------|
| 5.1 | Create Payment, Lease, PaymentSchedule entities | Database tables |
| 5.2 | Integrate Paystack SDK for payment initiation | POST /api/payments/initiate |
| 5.3 | Build Paystack webhook handler | POST /api/webhooks/paystack |
| 5.4 | Implement payment verification | GET /api/payments/{ref}/verify |
| 5.5 | Build lease creation with auto payment schedule | POST /api/leases |
| 5.6 | Implement recurring payment scheduler | Hangfire job |
| 5.7 | Build payment account management | CRUD /api/payment-accounts |
| 5.8 | Implement payment history and export | GET /api/payments/history |
| 5.9 | Build admin payment approval workflow | PUT /api/admin/payments/{id}/approve |
| 5.10 | Implement lease renewal flow | POST /api/leases/{id}/renew |

**Milestone**: End-to-end payment flow with Paystack works ✅

---

### Phase 6: Notifications & Messaging
**Duration: 1–2 weeks**

| # | Task | Deliverable |
|---|------|-------------|
| 6.1 | Build notification storage and retrieval | CRUD /api/notifications |
| 6.2 | Implement SignalR hub for real-time notifications | NotificationHub |
| 6.3 | Build push notification service (Web Push) | PushNotificationService |
| 6.4 | Implement email notification service | EmailService |
| 6.5 | Build payment reminder Hangfire job | Scheduled reminders |
| 6.6 | Implement property match alerts | Preference-based alerts |
| 6.7 | Build notification preference settings | PUT /api/users/notification-settings |

**Milestone**: Users receive real-time, push, and email notifications ✅

---

### Phase 7: Admin Management APIs
**Duration: 2 weeks**

| # | Task | Deliverable |
|---|------|-------------|
| 7.1 | Build admin dashboard statistics | GET /api/admin/dashboard |
| 7.2 | Implement user management (list, suspend, delete) | CRUD /api/admin/users |
| 7.3 | Build vendor approval workflow | PUT /api/admin/vendors/{id}/approve |
| 7.4 | Build service provider approval workflow | PUT /api/admin/providers/{id}/approve |
| 7.5 | Implement review moderation | PUT /api/admin/reviews/{id}/moderate |
| 7.6 | Build verification management | PUT /api/admin/verifications/{id} |
| 7.7 | Implement currency rate management | CRUD /api/admin/currencies |
| 7.8 | Build financial reports | GET /api/admin/reports/financial |
| 7.9 | Implement analytics (page visits, user activity) | GET /api/admin/analytics |
| 7.10 | Build FlexiScore override for admin | PUT /api/admin/users/{id}/flexi-score |

**Milestone**: Admin can fully manage the platform ✅

---

### Phase 8: Performance Optimization
**Duration: 1–2 weeks**

| # | Task | Deliverable |
|---|------|-------------|
| 8.1 | Add Redis caching for hot queries | Cache service |
| 8.2 | Implement database query optimization | EF query tuning |
| 8.3 | Add PostgreSQL indexes on search columns | Migration |
| 8.4 | Implement response compression | Gzip/Brotli |
| 8.5 | Add pagination everywhere (cursor or offset) | Consistent pagination |
| 8.6 | Implement connection pooling (Npgsql) | Connection config |
| 8.7 | Add ETag caching for GET endpoints | HTTP caching |
| 8.8 | Profile and optimize N+1 queries | Include/Split queries |
| 8.9 | Implement background job optimization | Hangfire tuning |

**Milestone**: API response times < 200ms for cached queries ✅

---

### Phase 9: Testing & Security
**Duration: 2 weeks**

| # | Task | Deliverable |
|---|------|-------------|
| 9.1 | Write unit tests for domain entities | xUnit tests |
| 9.2 | Write unit tests for application handlers | MediatR handler tests |
| 9.3 | Build integration tests with Testcontainers | PostgreSQL container tests |
| 9.4 | Write API controller integration tests | WebApplicationFactory |
| 9.5 | Implement architecture tests (ArchUnitNET) | Layer dependency tests |
| 9.6 | Add input validation on all endpoints | FluentValidation |
| 9.7 | Implement API rate limiting | AspNetCoreRateLimit |
| 9.8 | Security audit: SQL injection, XSS, CSRF | Penetration testing |
| 9.9 | Implement CORS policy | Strict origin policy |
| 9.10 | Add request/response logging (sanitized) | Serilog enrichers |
| 9.11 | Implement secret rotation strategy | Azure Key Vault / AWS Secrets |
| 9.12 | Achieve ≥ 80% code coverage | Coverage report |

**Milestone**: All critical paths tested, security hardened ✅

---

### Phase 10: Production Deployment
**Duration: 1–2 weeks**

| # | Task | Deliverable |
|---|------|-------------|
| 10.1 | Create production Dockerfile (multi-stage) | Optimized image |
| 10.2 | Set up docker-compose for production | Production compose |
| 10.3 | Configure GitHub Actions CD pipeline | Auto-deploy on merge |
| 10.4 | Set up staging environment | Staging server |
| 10.5 | Configure SSL/TLS with Let's Encrypt | HTTPS |
| 10.6 | Set up PostgreSQL backups (pg_dump cron) | Backup strategy |
| 10.7 | Configure Serilog sinks (Seq / Elastic) | Centralized logging |
| 10.8 | Set up health monitoring (Uptime Kuma) | Monitoring dashboard |
| 10.9 | Configure Nginx reverse proxy | nginx.conf |
| 10.10 | Production smoke tests | Deployment verification |
| 10.11 | Create runbook and incident response plan | Operations docs |
| 10.12 | DNS and domain configuration | Production domain |

**Milestone**: FlexiRents live in production ✅

---

## 5. Security Considerations

### Input Validation
```csharp
// FluentValidation example
public class CreatePropertyCommandValidator : AbstractValidator<CreatePropertyCommand>
{
    public CreatePropertyCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.Region).NotEmpty();
        RuleFor(x => x.Location).NotEmpty();
        RuleFor(x => x.PropertyType).IsInEnum();
        RuleFor(x => x.ListingType).IsInEnum();
        RuleFor(x => x.Description).MaximumLength(5000);
    }
}
```

### Security Checklist

| Area | Implementation |
|------|---------------|
| **SQL Injection** | EF Core parameterized queries — never raw SQL with string concatenation |
| **XSS Prevention** | Output encoding, Content-Security-Policy headers |
| **CSRF Protection** | Anti-forgery tokens for non-API consumers |
| **Rate Limiting** | AspNetCoreRateLimit: 100 req/min for auth, 1000 req/min general |
| **Authentication** | JWT with short expiry (15 min) + refresh tokens (7 days) |
| **Authorization** | Policy-based with role claims, resource-level checks |
| **Secrets** | Azure Key Vault or AWS Secrets Manager — never in appsettings |
| **CORS** | Strict origin allowlist — only FlexiRents frontend domains |
| **HTTPS** | Enforce HTTPS redirect, HSTS headers |
| **Password** | BCrypt hashing, minimum 8 chars, complexity rules |
| **File Upload** | Size limits (10MB), type validation, virus scanning |
| **Logging** | Never log passwords, tokens, or PII |
| **Dependencies** | Regular `dotnet list package --vulnerable` scans |

---

## 6. Deployment Plan

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main, develop]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: flexirents_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
      redis:
        image: redis:7
        ports: ['6379:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - run: dotnet restore
      - run: dotnet build --no-restore
      - run: dotnet test --no-build --collect:"XPlat Code Coverage"
      - uses: codecov/codecov-action@v3
```

```yaml
# .github/workflows/cd-production.yml
name: Deploy Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker image
        run: docker build -t flexirents-api:${{ github.sha }} .
      - name: Push to registry
        run: |
          docker tag flexirents-api:${{ github.sha }} registry/flexirents-api:latest
          docker push registry/flexirents-api:latest
      - name: Deploy to server
        run: |
          ssh deploy@server "cd /app && docker compose pull && docker compose up -d"
```

### Docker Configuration

```dockerfile
# Dockerfile (multi-stage)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.sln .
COPY src/FlexiRents.API/*.csproj src/FlexiRents.API/
COPY src/FlexiRents.Application/*.csproj src/FlexiRents.Application/
COPY src/FlexiRents.Domain/*.csproj src/FlexiRents.Domain/
COPY src/FlexiRents.Infrastructure/*.csproj src/FlexiRents.Infrastructure/
RUN dotnet restore
COPY . .
RUN dotnet publish src/FlexiRents.API -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "FlexiRents.API.dll"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports: ["8080:8080"]
    environment:
      - ConnectionStrings__DefaultConnection=Host=db;Database=flexirents;Username=flexirents;Password=${DB_PASSWORD}
      - Redis__ConnectionString=redis:6379
      - Jwt__Secret=${JWT_SECRET}
    depends_on: [db, redis]

  db:
    image: postgres:16
    volumes: [pgdata:/var/lib/postgresql/data]
    environment:
      POSTGRES_DB: flexirents
      POSTGRES_USER: flexirents
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  redis:
    image: redis:7-alpine

  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./certbot/conf:/etc/letsencrypt
    depends_on: [api]

volumes:
  pgdata:
```

### Hosting Options

| Option | Cost/Month | Best For |
|--------|-----------|----------|
| **Azure App Service + Azure DB** | $50–$150 | Enterprise, managed services |
| **AWS ECS + RDS** | $50–$120 | Scalability, AWS ecosystem |
| **DigitalOcean Droplet** | $24–$48 | Cost-effective, simple |
| **Hetzner VPS + Docker** | $10–$30 | Budget-friendly, EU hosting |
| **Railway.app** | $20–$50 | Quick deploy, managed |

---

## 7. Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| **Phase 1**: Project Setup | 1–2 weeks | Week 2 |
| **Phase 2**: Auth & Users | 2–3 weeks | Week 5 |
| **Phase 3**: Property System | 2–3 weeks | Week 8 |
| **Phase 4**: Booking System | 2 weeks | Week 10 |
| **Phase 5**: Payments | 2–3 weeks | Week 13 |
| **Phase 6**: Notifications | 1–2 weeks | Week 15 |
| **Phase 7**: Admin APIs | 2 weeks | Week 17 |
| **Phase 8**: Optimization | 1–2 weeks | Week 19 |
| **Phase 9**: Testing & Security | 2 weeks | Week 21 |
| **Phase 10**: Deployment | 1–2 weeks | Week 23 |
| **Total** | **~20–26 weeks** | **5–6 months** |

> **With a team of 2 backend developers**: ~3–4 months
> **With a team of 3+ developers**: ~2.5–3 months

---

## 8. Project Tracker

### Board View (Copy to Notion / Jira / Trello)

---

#### 🏗️ PROJECT SETUP

| Task | Description | Priority | Status | Assignee | Effort | Dependencies | % |
|------|-------------|----------|--------|----------|--------|--------------|---|
| Create .NET 8 solution | Set up Clean Architecture solution structure with all 4 projects | 🔴 Critical | To Do | Backend Lead | 4h | None | 0% |
| Configure EF Core + PostgreSQL | Set up DbContext, connection string, initial migration | 🔴 Critical | To Do | Backend Lead | 4h | Solution structure | 0% |
| Docker Compose setup | Create dev compose with API, PostgreSQL, Redis | 🔴 Critical | To Do | DevOps | 3h | Solution structure | 0% |
| Configure Serilog | Structured logging with console + file sinks | 🟡 High | To Do | Backend Dev 1 | 2h | Solution structure | 0% |
| Set up MediatR pipeline | Register MediatR with validation + logging behaviours | 🟡 High | To Do | Backend Lead | 3h | Solution structure | 0% |
| Configure Swagger/Scalar | API documentation with auth support | 🟢 Medium | To Do | Backend Dev 1 | 2h | Solution structure | 0% |
| GitHub Actions CI | Build + test pipeline on PR | 🟡 High | To Do | DevOps | 3h | Solution structure | 0% |
| Health checks | /health endpoint with DB + Redis checks | 🟢 Medium | To Do | Backend Dev 2 | 1h | Docker setup | 0% |
| Base entity abstractions | BaseEntity, AuditableEntity, IDomainEvent | 🟡 High | To Do | Backend Lead | 2h | Solution structure | 0% |
| Environment configuration | appsettings per environment + secrets | 🟡 High | To Do | Backend Lead | 2h | Solution structure | 0% |

---

#### 🔐 AUTHENTICATION & AUTHORIZATION

| Task | Description | Priority | Status | Assignee | Effort | Dependencies | % |
|------|-------------|----------|--------|----------|--------|--------------|---|
| User + Profile entities | Create domain entities and EF configurations | 🔴 Critical | To Do | Backend Lead | 4h | EF Core setup | 0% |
| UserRole entity + AppRole enum | Role entity with enum (User, Admin, Moderator, SP, Vendor) | 🔴 Critical | To Do | Backend Lead | 2h | User entity | 0% |
| JWT token service | Generate access (15min) + refresh (7d) tokens | 🔴 Critical | To Do | Backend Dev 1 | 6h | User entity | 0% |
| Registration endpoint | POST /api/auth/register with validation | 🔴 Critical | To Do | Backend Dev 1 | 4h | JWT service | 0% |
| Login endpoint | POST /api/auth/login with BCrypt verification | 🔴 Critical | To Do | Backend Dev 1 | 4h | JWT service | 0% |
| Token refresh endpoint | POST /api/auth/refresh with rotation | 🟡 High | To Do | Backend Dev 1 | 3h | JWT service | 0% |
| Password reset flow | Request reset + confirm with token | 🟡 High | To Do | Backend Dev 2 | 6h | Email service | 0% |
| Role-based auth policies | Configure [Authorize] policies per role | 🔴 Critical | To Do | Backend Lead | 3h | UserRole entity | 0% |
| CurrentUserService | Extract user from JWT claims | 🔴 Critical | To Do | Backend Dev 1 | 2h | JWT service | 0% |
| Seed admin user | Migration to create default admin | 🟡 High | To Do | Backend Lead | 1h | Registration | 0% |
| Auth unit tests | Test token generation, validation, registration | 🟡 High | To Do | Backend Dev 2 | 6h | All auth tasks | 0% |

---

#### 👤 USER MANAGEMENT

| Task | Description | Priority | Status | Assignee | Effort | Dependencies | % |
|------|-------------|----------|--------|----------|--------|--------------|---|
| Get profile endpoint | GET /api/users/profile | 🔴 Critical | To Do | Backend Dev 2 | 2h | Auth | 0% |
| Update profile endpoint | PUT /api/users/profile (name, phone) | 🔴 Critical | To Do | Backend Dev 2 | 3h | Get profile | 0% |
| Avatar upload | PUT /api/users/avatar with file storage | 🟡 High | To Do | Backend Dev 2 | 4h | File storage service | 0% |
| Emergency contact CRUD | PUT /api/users/emergency-contact | 🟢 Medium | To Do | Backend Dev 2 | 3h | Profile | 0% |
| User verification submission | POST /api/users/verification with doc upload | 🟡 High | To Do | Backend Dev 2 | 6h | File storage | 0% |
| Privacy settings | PUT /api/users/privacy (online status, search visibility) | 🟢 Medium | To Do | Backend Dev 2 | 3h | Profile | 0% |
| Account deletion request | POST /api/users/delete-request | 🟢 Medium | To Do | Backend Dev 2 | 3h | Auth | 0% |
| User preferences | PUT /api/users/preferences (property alerts config) | 🟢 Medium | To Do | Backend Dev 2 | 4h | Profile | 0% |

---

#### 🏠 PROPERTY LISTINGS

| Task | Description | Priority | Status | Assignee | Effort | Dependencies | % |
|------|-------------|----------|--------|----------|--------|--------------|---|
| Property entity + config | Domain entity with EF config | 🔴 Critical | To Do | Backend Lead | 4h | EF Core | 0% |
| Create property | POST /api/properties with multi-image upload | 🔴 Critical | To Do | Backend Dev 1 | 6h | Property entity | 0% |
| Update property | PUT /api/properties/{id} (owner only) | 🔴 Critical | To Do | Backend Dev 1 | 4h | Create property | 0% |
| Delete property | DELETE /api/properties/{id} (owner + admin) | 🟡 High | To Do | Backend Dev 1 | 2h | Property entity | 0% |
| List properties (paginated) | GET /api/properties with cursor pagination | 🔴 Critical | To Do | Backend Dev 1 | 4h | Property entity | 0% |
| Property details | GET /api/properties/{id} | 🔴 Critical | To Do | Backend Dev 1 | 2h | Property entity | 0% |
| Advanced search + filters | GET /api/properties/search (region, type, price, beds) | 🔴 Critical | To Do | Backend Dev 1 | 8h | List properties | 0% |
| Full-text search (tsvector) | PostgreSQL full-text search index on title + description | 🟡 High | To Do | Backend Lead | 4h | Search endpoint | 0% |
| My properties | GET /api/properties/mine (owner dashboard) | 🟡 High | To Do | Backend Dev 1 | 3h | Auth + Properties | 0% |
| Admin approve/reject | PUT /api/admin/properties/{id}/status | 🔴 Critical | To Do | Backend Dev 1 | 3h | Admin auth | 0% |
| Wishlist CRUD | POST/DELETE/GET /api/wishlist | 🟢 Medium | To Do | Backend Dev 2 | 4h | Properties + Auth | 0% |
| Redis caching for listings | Cache popular queries for 5 min | 🟡 High | To Do | Backend Dev 1 | 4h | Redis setup | 0% |

---

#### 📅 BOOKING SYSTEM

| Task | Description | Priority | Status | Assignee | Effort | Dependencies | % |
|------|-------------|----------|--------|----------|--------|--------------|---|
| Booking entities | Booking, BookingRequest, ViewingSchedule | 🔴 Critical | To Do | Backend Lead | 4h | EF Core | 0% |
| Create viewing schedule | POST /api/viewings | 🔴 Critical | To Do | Backend Dev 2 | 4h | Properties + Auth | 0% |
| Service provider booking | POST /api/bookings | 🔴 Critical | To Do | Backend Dev 2 | 6h | Provider entity | 0% |
| Booking status workflow | Accept/reject/cancel with state machine | 🔴 Critical | To Do | Backend Dev 2 | 4h | Booking entity | 0% |
| Provider availability | CRUD /api/providers/availability | 🟡 High | To Do | Backend Dev 2 | 4h | Provider entity | 0% |
| Booking messaging (SignalR) | Real-time chat per booking | 🟡 High | To Do | Backend Dev 1 | 8h | Bookings + Auth | 0% |
| Booking history | GET /api/bookings (with filters) | 🟡 High | To Do | Backend Dev 2 | 3h | Bookings | 0% |
| Cancel booking | PUT /api/bookings/{id}/cancel | 🟡 High | To Do | Backend Dev 2 | 2h | Booking status | 0% |

---

#### 💳 PAYMENT INTEGRATION

| Task | Description | Priority | Status | Assignee | Effort | Dependencies | % |
|------|-------------|----------|--------|----------|--------|--------------|---|
| Payment entities | RentalPayment, RentalLease, PaymentSchedule, PaymentAccount | 🔴 Critical | To Do | Backend Lead | 6h | EF Core | 0% |
| Paystack SDK integration | Service wrapper for Paystack API | 🔴 Critical | To Do | Backend Dev 1 | 6h | None | 0% |
| Initiate payment | POST /api/payments/initiate → Paystack | 🔴 Critical | To Do | Backend Dev 1 | 4h | Paystack SDK | 0% |
| Paystack webhook handler | POST /api/webhooks/paystack (verify signature) | 🔴 Critical | To Do | Backend Dev 1 | 6h | Paystack SDK | 0% |
| Payment verification | GET /api/payments/{ref}/verify | 🟡 High | To Do | Backend Dev 1 | 3h | Paystack SDK | 0% |
| Lease creation + schedule | POST /api/leases (auto-generates payment schedule) | 🔴 Critical | To Do | Backend Lead | 8h | Payment entities | 0% |
| Recurring payment scheduler | Hangfire job for auto-payments | 🟡 High | To Do | Backend Dev 1 | 6h | Lease + Paystack | 0% |
| Payment account management | CRUD /api/payment-accounts | 🟡 High | To Do | Backend Dev 2 | 4h | Auth | 0% |
| Payment history + export | GET /api/payments/history + CSV export | 🟢 Medium | To Do | Backend Dev 2 | 4h | Payments | 0% |
| Admin payment approval | PUT /api/admin/payments/{id}/approve | 🟡 High | To Do | Backend Dev 1 | 3h | Admin auth | 0% |
| Lease renewal | POST /api/leases/{id}/renew | 🟢 Medium | To Do | Backend Dev 2 | 4h | Lease | 0% |

---

#### 🔔 NOTIFICATIONS

| Task | Description | Priority | Status | Assignee | Effort | Dependencies | % |
|------|-------------|----------|--------|----------|--------|--------------|---|
| Notification entity | In-app notification storage | 🟡 High | To Do | Backend Dev 2 | 2h | EF Core | 0% |
| SignalR notification hub | Real-time push to connected clients | 🟡 High | To Do | Backend Dev 1 | 6h | Auth | 0% |
| Email notification service | Transactional emails (SendGrid / SMTP) | 🟡 High | To Do | Backend Dev 2 | 4h | None | 0% |
| Web push notifications | Push API subscription + delivery | 🟢 Medium | To Do | Backend Dev 2 | 6h | Auth | 0% |
| Payment reminders | Hangfire job: remind N days before due | 🟡 High | To Do | Backend Dev 1 | 4h | Payments + Hangfire | 0% |
| Property match alerts | Notify when new property matches preferences | 🟢 Medium | To Do | Backend Dev 2 | 4h | Preferences + Props | 0% |
| Mark notification read | PUT /api/notifications/{id}/read | 🟢 Medium | To Do | Backend Dev 2 | 1h | Notifications | 0% |

---

#### 🛡️ ADMIN APIs

| Task | Description | Priority | Status | Assignee | Effort | Dependencies | % |
|------|-------------|----------|--------|----------|--------|--------------|---|
| Dashboard statistics | GET /api/admin/dashboard (counts, revenue) | 🔴 Critical | To Do | Backend Lead | 6h | All entities | 0% |
| User management | GET/PUT/DELETE /api/admin/users | 🔴 Critical | To Do | Backend Dev 1 | 4h | User entity | 0% |
| Vendor approval | PUT /api/admin/vendors/{id}/approve | 🟡 High | To Do | Backend Dev 2 | 3h | Vendor entity | 0% |
| Service provider approval | PUT /api/admin/providers/{id}/approve | 🟡 High | To Do | Backend Dev 2 | 3h | Provider entity | 0% |
| Review moderation | GET/PUT /api/admin/reviews | 🟢 Medium | To Do | Backend Dev 2 | 3h | Review entity | 0% |
| Verification management | GET/PUT /api/admin/verifications | 🟡 High | To Do | Backend Dev 1 | 4h | Verification entity | 0% |
| Currency management | CRUD /api/admin/currencies | 🟢 Medium | To Do | Backend Dev 2 | 3h | Currency entity | 0% |
| Financial reports | GET /api/admin/reports (revenue, payments) | 🟡 High | To Do | Backend Lead | 6h | Payments | 0% |
| Analytics API | GET /api/admin/analytics (visits, engagement) | 🟢 Medium | To Do | Backend Dev 2 | 4h | PageVisit entity | 0% |
| FlexiScore admin override | PUT /api/admin/users/{id}/flexi-score/override | 🟡 High | To Do | Backend Lead | 3h | Assessment entity | 0% |

---

#### 🔒 SECURITY

| Task | Description | Priority | Status | Assignee | Effort | Dependencies | % |
|------|-------------|----------|--------|----------|--------|--------------|---|
| FluentValidation on all endpoints | Input validation for all commands | 🔴 Critical | To Do | All Devs | 8h | All endpoints | 0% |
| API rate limiting | AspNetCoreRateLimit configuration | 🔴 Critical | To Do | Backend Lead | 3h | API setup | 0% |
| CORS strict policy | Allow only FlexiRents frontend origins | 🔴 Critical | To Do | Backend Lead | 1h | API setup | 0% |
| Secrets management | Azure Key Vault / AWS Secrets setup | 🟡 High | To Do | DevOps | 4h | Deployment | 0% |
| Security headers | HSTS, CSP, X-Content-Type-Options | 🟡 High | To Do | Backend Lead | 2h | API setup | 0% |
| Vulnerability scan | `dotnet list package --vulnerable` | 🟡 High | To Do | DevOps | 2h | All packages | 0% |
| Penetration testing | OWASP Top 10 check | 🟡 High | To Do | Security | 8h | All endpoints | 0% |

---

#### 🧪 TESTING

| Task | Description | Priority | Status | Assignee | Effort | Dependencies | % |
|------|-------------|----------|--------|----------|--------|--------------|---|
| Domain unit tests | Test entity business logic | 🔴 Critical | To Do | Backend Dev 2 | 8h | Domain entities | 0% |
| Handler unit tests | Test MediatR handlers with mocks | 🔴 Critical | To Do | Backend Dev 2 | 12h | Application layer | 0% |
| Integration tests setup | WebApplicationFactory + Testcontainers | 🔴 Critical | To Do | Backend Lead | 4h | All layers | 0% |
| API integration tests | End-to-end controller tests | 🟡 High | To Do | Backend Dev 2 | 12h | Integration setup | 0% |
| Architecture tests | ArchUnitNET layer dependency validation | 🟢 Medium | To Do | Backend Lead | 3h | Solution structure | 0% |
| Load testing | k6 or JMeter performance tests | 🟢 Medium | To Do | DevOps | 6h | Deployed API | 0% |
| Code coverage report | Coverlet + codecov integration | 🟡 High | To Do | DevOps | 2h | All tests | 0% |

---

#### 🚀 DEPLOYMENT

| Task | Description | Priority | Status | Assignee | Effort | Dependencies | % |
|------|-------------|----------|--------|----------|--------|--------------|---|
| Production Dockerfile | Multi-stage build, optimized | 🔴 Critical | To Do | DevOps | 3h | API build | 0% |
| Docker Compose production | API + DB + Redis + Nginx | 🔴 Critical | To Do | DevOps | 4h | Dockerfile | 0% |
| GitHub Actions CD | Auto-deploy on merge to main | 🔴 Critical | To Do | DevOps | 6h | CI pipeline | 0% |
| Staging environment | Deploy to staging server | 🟡 High | To Do | DevOps | 4h | CD pipeline | 0% |
| SSL/TLS setup | Let's Encrypt + auto-renew | 🔴 Critical | To Do | DevOps | 2h | Nginx | 0% |
| Database backups | pg_dump cron job + off-site storage | 🔴 Critical | To Do | DevOps | 3h | PostgreSQL | 0% |
| Monitoring setup | Uptime Kuma + Serilog dashboard | 🟡 High | To Do | DevOps | 4h | Deployed API | 0% |
| Production smoke tests | Automated post-deploy verification | 🟡 High | To Do | DevOps | 3h | CD pipeline | 0% |
| DNS configuration | Point domain to production server | 🔴 Critical | To Do | DevOps | 1h | Server ready | 0% |
| Runbook documentation | Incident response + troubleshooting guide | 🟢 Medium | To Do | Backend Lead | 4h | All phases | 0% |

---

## 9. Sprint Organization

### Sprint 1–2: Foundation (Weeks 1–2)
**Goal**: API running with Docker, connected to PostgreSQL

| Deliverable | Owner |
|-------------|-------|
| Solution structure created | Backend Lead |
| Docker Compose working | DevOps |
| EF Core + first migration | Backend Lead |
| CI pipeline running | DevOps |
| Swagger docs accessible | Backend Dev 1 |

---

### Sprint 3–4: Authentication (Weeks 3–4)
**Goal**: Users can register, login, manage profiles

| Deliverable | Owner |
|-------------|-------|
| Register + Login endpoints | Backend Dev 1 |
| JWT + Refresh tokens | Backend Dev 1 |
| Role-based authorization | Backend Lead |
| Profile CRUD | Backend Dev 2 |
| Auth unit tests | Backend Dev 2 |

---

### Sprint 5–6: Properties (Weeks 5–7)
**Goal**: Full property listing lifecycle

| Deliverable | Owner |
|-------------|-------|
| Property CRUD endpoints | Backend Dev 1 |
| Advanced search + filters | Backend Dev 1 |
| Full-text search | Backend Lead |
| Admin approval workflow | Backend Dev 1 |
| Wishlist | Backend Dev 2 |

---

### Sprint 7–8: Bookings (Weeks 8–9)
**Goal**: Booking and viewing system works

| Deliverable | Owner |
|-------------|-------|
| Viewing schedule endpoints | Backend Dev 2 |
| Service provider bookings | Backend Dev 2 |
| SignalR messaging | Backend Dev 1 |
| Booking status workflow | Backend Dev 2 |

---

### Sprint 9–11: Payments (Weeks 10–12)
**Goal**: Paystack integration end-to-end

| Deliverable | Owner |
|-------------|-------|
| Paystack integration | Backend Dev 1 |
| Webhook handler | Backend Dev 1 |
| Lease + payment schedule | Backend Lead |
| Recurring payments | Backend Dev 1 |
| Payment history + export | Backend Dev 2 |

---

### Sprint 12–13: Notifications (Weeks 13–14)
**Goal**: Multi-channel notification system

| Deliverable | Owner |
|-------------|-------|
| SignalR notification hub | Backend Dev 1 |
| Email notifications | Backend Dev 2 |
| Push notifications | Backend Dev 2 |
| Payment reminders | Backend Dev 1 |

---

### Sprint 14–15: Admin (Weeks 15–16)
**Goal**: Admin can fully manage the platform

| Deliverable | Owner |
|-------------|-------|
| Dashboard stats API | Backend Lead |
| User management | Backend Dev 1 |
| Vendor/provider approval | Backend Dev 2 |
| Financial reports | Backend Lead |

---

### Sprint 16–18: Polish & Ship (Weeks 17–20)
**Goal**: Optimized, tested, deployed

| Deliverable | Owner |
|-------------|-------|
| Redis caching | Backend Dev 1 |
| Full test coverage (≥80%) | Backend Dev 2 |
| Security hardening | Backend Lead |
| Production deployment | DevOps |
| Monitoring + backups | DevOps |

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Phases** | 10 |
| **Total Tasks** | ~120 |
| **Estimated Duration** | 20–26 weeks (5–6 months solo, 3–4 months with team) |
| **Recommended Team** | 1 Backend Lead + 2 Backend Devs + 1 DevOps |
| **Architecture** | Clean Architecture (Modular Monolith) |
| **Primary Stack** | .NET 8 + EF Core + PostgreSQL + Redis |
| **Payment Gateway** | Paystack |
| **Real-time** | SignalR |
| **Background Jobs** | Hangfire |
| **Deployment** | Docker + GitHub Actions CI/CD |

---

*Last Updated: 2026-03-14*
