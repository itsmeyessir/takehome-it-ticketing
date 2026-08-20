# Architecture: Layered Controller-Service-Repository

## Pattern Name
**CSR Layered Architecture** (Controller → Service → Repository)

## Why This Pattern
- Pragmatic for scoped take-home — avoids Clean Architecture boilerplate
- Industry-standard for TypeScript/Express APIs
- Testable: services can be tested without HTTP layer
- Thin controllers, fat services, anemic repositories
- Easily consumable by future mobile clients (clean REST, no web-specific assumptions)

## Architecture Diagram

```mermaid
flowchart TD
    classDef frontend fill:#0070f3,stroke:#fff,stroke-width:2px,color:#fff;
    classDef backend fill:#3178c6,stroke:#fff,stroke-width:2px,color:#fff;
    classDef db fill:#336791,stroke:#fff,stroke-width:2px,color:#fff;
    classDef layer fill:#f9f9f9,stroke:#333,stroke-width:1px,stroke-dasharray: 5 5;
    classDef cross fill:#fef3c7,stroke:#f59e0b,stroke-width:2px,color:#000;

    User([End User / Department Member])

    subgraph Monorepo [Monorepo Workspace]
        subgraph Shared [packages/shared]
            Types[Shared Types\nTicket, User, Department\nRole Enums, Status Enums]:::cross
        end

        subgraph WebApp [apps/web]
            NextJS[Next.js Application]:::frontend
            Pages[Pages\nLogin, Register\nDashboard, Ticket Detail]:::frontend
            Components[Components\nTicketCard, StatusBadge\nActivityLog, Layout]:::frontend
            APIClient[API Client\nFetch wrapper\nToken management]:::frontend
            NextJS --> Pages
            NextJS --> Components
            NextJS --> APIClient
        end

        subgraph ApiApp [apps/api - Express + TypeScript]
            direction TB
            Controllers[Controllers\nHTTP Parsing, Request Validation\nResponse Formatting]:::layer
            Middleware[Middleware\nJWT Verification\nError Handling\nRequest Validation]:::layer
            Services[Services\nBusiness Logic, Auth Rules\nState Transitions\nActivity Logging]:::layer
            Repositories[Repositories\nPrisma Client Calls\nNo Business Logic]:::layer
            Config[Config\nPipeline Definitions\nStatus/Role Enums\nConstants]:::cross

            Controllers -->|Parsed Request / DTO| Middleware
            Middleware -->|Authenticated Request| Services
            Services -->|Entity / Model calls| Repositories
            Services -->|Reads pipeline rules| Config
        end
    end

    subgraph Infra [Docker Compose]
        Postgres[(PostgreSQL Database\nTickets, Users, Departments\nActivity Logs)]:::db
        Prisma[Prisma ORM\nSchema as Source of Truth]:::db
    end

    User -->|Interacts with UI| NextJS
    APIClient -->|REST API Calls w/ JWT token| Controllers
    Repositories -->|SQL Queries / ORM Operations| Prisma
    Prisma -->|Database Connection| Postgres
```

## Layers

### 1. Controllers
- Handle HTTP request/response cycle
- Parse request body, params, query strings
- Validate input shape (not business rules)
- Call appropriate service method
- Format and return response
- **Never** contain `if` statements about business logic

### 2. Middleware
- **JWT Middleware:** Verify token, attach user to request
- **Error Middleware:** Catch all errors, return consistent format
- **Validation Middleware:** Validate request shape before controller

### 3. Services
- Business logic lives here
- Authorization rules ("Can this user escalate this ticket?")
- State transitions ("Is this status change valid?")
- Activity logging ("Log this action after it succeeds")
- **This is the most important layer**

### 4. Repositories
- Thin wrappers around Prisma client calls
- No business logic, no authorization checks
- Simply fetch and return data
- Easy to swap ORM if needed (unlikely, but clean)

### 5. Config
- Hardcoded pipeline definitions
- Status and role enums
- Constants (token expiry, etc.)

## Monorepo Structure

```
takehome/
├── package.json              # Root workspace config
├── docker-compose.yml        # PostgreSQL
├── apps/
│   ├── api/                  # Express backend
│   └── web/                  # Next.js frontend
└── packages/
    └── shared/               # Shared TypeScript types
```

## Infrastructure
- Docker Compose → PostgreSQL (local dev only)
- Prisma ORM → schema.prisma as source of truth
- Seed script → departments, users, ticket types, sample tickets
- npm workspaces → dependency management across monorepo
