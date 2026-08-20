import { vi, beforeAll, afterAll } from "vitest";

// Set env vars BEFORE any imports so constants.ts can read them
process.env.JWT_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Mock Prisma client for all tests
vi.mock("@prisma/client", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    department: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    ticket: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    ticketType: {
      findMany: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    $disconnect: vi.fn(),
  };

  return {
    PrismaClient: vi.fn(() => mockPrisma),
    Role: { END_USER: "END_USER", DEPARTMENT_MEMBER: "DEPARTMENT_MEMBER" },
    TicketStatus: {
      OPEN: "OPEN",
      IN_PROGRESS: "IN_PROGRESS",
      ESCALATED: "ESCALATED",
      RESOLVED: "RESOLVED",
      CLOSED: "CLOSED",
    },
    ActionType: {
      CREATED: "CREATED",
      ASSIGNED: "ASSIGNED",
      REASSIGNED: "REASSIGNED",
      STATUS_CHANGE: "STATUS_CHANGE",
      ESCALATED: "ESCALATED",
    },
  };
});

// Mock Prisma db singleton
vi.mock("../../src/config/db.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    department: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    ticket: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    ticketType: {
      findMany: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Mock jsonwebtoken
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock-jwt-token"),
    verify: vi.fn().mockReturnValue({
      userId: "user-1",
      email: "test@test.com",
      role: "DEPARTMENT_MEMBER",
      departmentId: "dept-1",
    }),
  },
}));

afterAll(() => {
  vi.restoreAllMocks();
});
