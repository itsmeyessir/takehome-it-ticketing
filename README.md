# IT Ticketing System

A full-stack IT ticketing system built as a monorepo with Express + TypeScript (backend), Next.js (frontend), PostgreSQL, and Prisma ORM.

Tickets flow through **hardcoded pipelines** — ordered lists of departments that handle escalation. End users submit tickets, department members assign and escalate them, and every action is logged.

---

## Quick Start

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This runs PostgreSQL 16 on port **5433** (5432 is reserved for any existing local instance).

### 2. Install dependencies

```bash
npm install
```

### 3. Set up the database

```bash
cd apps/api
cp .env.example .env    # or create .env with the content below
npx prisma db push
npm run seed
```

### 4. Start the app

```bash
# Terminal 1 — API (http://localhost:4000)
cd apps/api
npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd apps/web
npm run dev
```

---

## Environment Variables

Create `apps/api/.env`:

```
DATABASE_URL="postgresql://takehome:takehome_secret@localhost:5433/takehome?schema=public"
JWT_SECRET="your-secret-key-here"
```

---

## Seed Data

Running `npm run seed` populates the database with:

### Departments

| Name | Slug | Role in Pipelines |
|---|---|---|
| Help Desk | `help-desk` | Entry point for all tickets |
| Tier 2 Support | `tier-2-support` | Intermediate escalation |
| Infrastructure | `infrastructure` | Final escalation (hardware/access) |
| Marketing | `marketing` | Not in any pipeline (end-user department) |

### Users

| Name | Email | Password | Role | Department |
|---|---|---|---|---|
| Angelo Tamparong | angelo@company.com | password123 | Department Member | Help Desk |
| Dhan Marano | dhan@company.com | password123 | Department Member | Help Desk |
| Andrew Basilio | andrew@company.com | password123 | Department Member | Tier 2 Support |
| Aljean Bonilla | aljean@company.com | password123 | Department Member | Tier 2 Support |
| Jasper Pastrana | jasper@company.com | password123 | Department Member | Infrastructure |
| Iber Fat | iber@company.com | password123 | End User | Marketing |

### Ticket Types & Pipelines

| Type | Pipeline |
|---|---|
| IT Hardware | Help Desk → Tier 2 Support → Infrastructure |
| Software Request | Help Desk → Tier 2 Support |
| Access Request | Help Desk → Tier 2 Support → Infrastructure |

### Sample Tickets

| Title | Type | Status | Assigned To |
|---|---|---|---|
| Laptop screen flickering | IT Hardware | In Progress | Angelo Tamparong (Help Desk) |
| Request Photoshop license | Software Request | Open | Unassigned |
| VPN access for remote work | Access Request | Escalated | Unassigned (Tier 2 Support) |
| New keyboard and mouse request | IT Hardware | Resolved | Dhan Marano (Help Desk) |
| Slack desktop app crashing | Software Request | In Progress | Andrew Basilio (Tier 2 Support) |

---

## Running Tests

```bash
# Backend (43 tests)
cd apps/api && npm test

# Frontend (13 tests)
cd apps/web && npm test
```

---

## API Endpoints

### Auth (public)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user (requires token) |
| PATCH | `/api/auth/me` | Update current user's profile (name, email, department) |

### Tickets (authenticated)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tickets` | List tickets for current department (unassigned + assigned). Supports `?limit=&offset=` pagination |
| POST | `/api/tickets` | Create a new ticket |
| GET | `/api/tickets/:id` | Get ticket detail with embedded activity log |
| POST | `/api/tickets/:id/assign` | Assign ticket to a member |
| POST | `/api/tickets/:id/status` | Update ticket status |
| POST | `/api/tickets/:id/escalate` | Escalate to next department |
| GET | `/api/tickets/:id/activities` | Get activity log (standalone endpoint) |

### Departments (authenticated, except list)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/departments` | List all departments (public) |
| GET | `/api/departments/:id` | Get department detail |
| GET | `/api/departments/:id/members` | List department members |

### Ticket Types (authenticated)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ticket-types` | List all ticket types |

---

## Design Decisions

### Schema: Why `assignedToId` is nullable

The assignment and status fields are **orthogonal**. A ticket can be `OPEN` and unassigned, or `OPEN` and assigned. Making `assignedToId` nullable means:
- Unassigned tickets appear in the department queue without needing a special "unassigned" user
- Escalation clears the assignee (sets to `null`) since the next department needs to re-assign
- Status changes don't require re-assigning, and re-assigning doesn't change status

### Pipelines: Why hardcoded, not database-driven

For a take-home project, hardcoded pipelines in `config/constants.ts` are the right call:
- No extra UI needed to manage pipeline configuration
- No ambiguity about what "next department" means during escalation
- Easy to reason about and test
- The `PIPELINE_STAGES` record maps ticket type names to ordered department slug arrays — adding a new pipeline is a one-line change

### Auth: JWT with centralized secret

- JWT tokens carry `userId`, `email`, `role`, and `departmentId`
- `JWT_SECRET` is centralized in `config/constants.ts` and throws at startup if missing
- Token expiry is 15 minutes (short-lived, suitable for a demo)
- All routes except `/api/auth/register`, `/api/auth/login`, and `/api/departments` require a valid token

### Activity Log: Structured, not free-text

Every action (created, assigned, status change, escalated) is logged with:
- `action_type` — enum: `CREATED`, `ASSIGNED`, `REASSIGNED`, `STATUS_CHANGE`, `ESCALATED`
- `old_value` / `new_value` — what changed (e.g., "Help Desk" → "Tier 2 Support")
- `message` — optional free-text (used for escalation notes)
- `actor_id` — who performed the action

This makes the activity log queryable and filterable, unlike a raw text field.

### Architecture: CSR Layered (Controller → Service → Repository)

- **Controllers** handle HTTP parsing and response formatting — no business logic
- **Services** contain all business rules, authorization checks, and state transitions
- **Repositories** are thin Prisma wrappers — easy to swap if needed
- This is simpler than full Clean Architecture but still testable and well-structured

### Frontend: Server Components by default

Next.js App Router pages are server components by default. Client-side interactivity (forms, buttons) uses `"use client"` directives. The API client (`lib/api.ts`) handles JWT token injection and error propagation.

---

## Project Structure

```
takehome/
├── package.json                 # Monorepo root (npm workspaces)
├── docker-compose.yml           # PostgreSQL container
├── apps/
│   ├── api/                     # Express backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # Database schema
│   │   │   └── seed.ts          # Seed script
│   │   ├── src/
│   │   │   ├── config/          # Constants, DB client, pipeline defs
│   │   │   ├── controllers/     # HTTP request handlers
│   │   │   ├── middleware/       # Auth, error, validation
│   │   │   ├── repositories/    # Prisma queries
│   │   │   ├── routes/          # Express route definitions
│   │   │   ├── services/        # Business logic
│   │   │   ├── app.ts           # Express app setup
│   │   │   └── server.ts        # Entry point
│   │   └── tests/               # Unit + integration tests
│   └── web/                     # Next.js frontend
│       └── src/
│           ├── app/             # Pages (App Router)
│           ├── components/      # Reusable UI components
│           ├── lib/             # API client, auth utils
│           └── __tests__/       # Frontend tests
└── packages/
    └── shared/                  # Shared TypeScript types
```
