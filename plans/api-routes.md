# API Routes

## Response Envelope

All endpoints return a consistent format:

```typescript
// Success
{ data: T }

// Error
{ error: { message: string, code: string } }
```

## Auth Routes

| Method | Endpoint | Body | Response | Auth Required |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{ email, name, password, departmentId }` | `{ data: { user, token } }` | No |
| POST | `/api/auth/login` | `{ email, password }` | `{ data: { user, token } }` | No |
| GET | `/api/auth/me` | — | `{ data: { user } }` | Yes |

## Department Routes

| Method | Endpoint | Body | Response | Auth Required |
|---|---|---|---|---|
| GET | `/api/departments` | — | `{ data: Department[] }` | Yes |
| GET | `/api/departments/:id` | — | `{ data: Department }` | Yes |
| GET | `/api/departments/:id/members` | — | `{ data: User[] }` | Yes |

## Ticket Routes

| Method | Endpoint | Body | Response | Auth Required |
|---|---|---|---|---|
| GET | `/api/tickets` | Query: `?status=&departmentId=&assignedToId=` | `{ data: Ticket[] }` | Yes |
| GET | `/api/tickets/:id` | — | `{ data: TicketWithDetails }` | Yes |
| POST | `/api/tickets` | `{ title, description, ticketTypeId }` | `{ data: Ticket }` | Yes |
| PATCH | `/api/tickets/:id/status` | `{ status, remark? }` | `{ data: Ticket }` | Yes |
| POST | `/api/tickets/:id/assign` | `{ assigneeId }` | `{ data: Ticket }` | Yes |
| POST | `/api/tickets/:id/escalate` | `{ message? }` | `{ data: Ticket }` | Yes |

## Activity Log Routes

| Method | Endpoint | Body | Response | Auth Required |
|---|---|---|---|---|
| GET | `/api/tickets/:id/activities` | — | `{ data: ActivityLog[] }` | Yes |

## Ticket Types Routes

| Method | Endpoint | Body | Response | Auth Required |
|---|---|---|---|---|
| GET | `/api/ticket-types` | — | `{ data: TicketType[] }` | Yes |

## Status Enum Values

```
OPEN | IN_PROGRESS | ESCALATED | RESOLVED | CLOSED
```

## Role Enum Values

```
END_USER | DEPARTMENT_MEMBER
```

## Action Type Enum Values (Activity Log)

```
CREATED | ASSIGNED | REASSIGNED | STATUS_CHANGE | ESCALATED
```

## Key Business Rules (enforced in Services)

1. **Ticket Creation:** Any authenticated user can create. Status starts as OPEN. Assigned to first department in pipeline, assignee is null.
2. **Assignment:** Only Department Members in the ticket's current department can assign. Can assign to self or any member of that department.
3. **Status Change:** Only Department Members in the ticket's current department can change status.
4. **Escalation:** Only Department Members in the ticket's current department can escalate. Sets status to ESCALATED, clears assignee, moves ticket to next department in pipeline.
5. **Pipeline End:** If ticket is at last department and escalated, it goes to RESOLVED (or stays — depends on decision).
