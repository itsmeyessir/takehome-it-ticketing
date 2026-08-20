# Design Language: Clean Enterprise

## Style Choice

**Clean Enterprise** — flat surfaces, clear hierarchy, strong status colors, high contrast.

## Why Not Alternatives

| Style | Verdict | Reason |
|---|---|---|
| Glassmorphism | No | Translucent panels destroy readability for data-heavy UIs. Ticketing systems have text, tables, and status badges — glass blur fights against that. |
| Neumorphism | No | Subtle shadows on same-color backgrounds make interactive elements ambiguous. "Is that a button or a div?" is a fatal UX flaw in an internal tool. |
| Clean Enterprise | Yes | Flat surfaces, clear hierarchy, strong status colors, high contrast. This is what Jira, Linear, Zendesk, and PagerDuty all use. |

## Color System

### Base Colors
| Token | Hex | Usage |
|---|---|---|
| Background | #FFFFFF | Page background |
| Surface | #F8FAFC | Cards, panels, modals |
| Border | #E2E8F0 | Separators, card borders |
| Text Primary | #0F172A | Headings, body text |
| Text Secondary | #64748B | Labels, descriptions, timestamps |

### Interactive Colors
| Token | Hex | Usage |
|---|---|---|
| Primary | #2563EB | Links, CTAs, active states |
| Primary Hover | #1D4ED8 | Button hover states |
| Destructive | #DC2626 | Delete, close, danger actions |
| Destructive Hover | #B91C1C | Destructive button hover |

### Status Colors
| Status | Hex | Badge Usage |
|---|---|---|
| Open | #3B82F6 | Blue — new, unstarted |
| In Progress | #F59E0B | Amber — actively being worked |
| Escalated | #EF4444 | Red — needs higher-level attention |
| Resolved | #10B981 | Green — solution found |
| Closed | #6B7280 | Gray — completed, archived |

## Typography

- **Font:** Inter (Google Fonts, free, clean, legible)
- **Headings:** Semi-bold (600), tight letter spacing
- **Body:** Regular (400), relaxed line height (1.6)
- **Monospace:** JetBrains Mono (for code, IDs if needed)

## Components (shadcn/ui)

| Component | Usage |
|---|---|
| Button | Actions: default, destructive, outline, ghost variants |
| Card | Ticket cards, dashboard panels, form containers |
| Badge | Status indicators, role tags |
| Dialog | Escalation messages, confirmation modals |
| Input | Form fields |
| Select | Ticket type picker, department picker |
| Table | Ticket lists (alternative to card grid) |
| Avatar | User initials/profile |
| Tabs | Department view (unassigned / assigned tabs) |
| Toast | Success/error notifications |

## Layout Principles

- **Dashboard:** Two-column layout — sidebar (navigation) + main content area
- **Ticket List:** Card grid or table, with status badges prominent
- **Ticket Detail:** Full-page view with activity log timeline
- **Forms:** Centered card layout for login/register
- **Responsive:** Stack columns on mobile, but mobile is NOT in scope (no React Native assignment)

## Accessibility

- shadcn/ui built on Radix primitives → keyboard navigation by default
- Status colors have sufficient contrast ratios (WCAG AA)
- Focus states visible on all interactive elements
- Screen reader labels on icons and action buttons
