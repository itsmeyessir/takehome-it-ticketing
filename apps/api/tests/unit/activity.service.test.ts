import { describe, it, expect, vi, beforeEach } from "vitest";
import * as activityRepo from "../../src/repositories/activity.repository.js";
import { PrismaClient, ActionType } from "@prisma/client";

vi.mock("@prisma/client", () => {
  const mockPrisma = {
    activityLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrisma),
    ActionType: {
      CREATED: "CREATED",
      ASSIGNED: "ASSIGNED",
      REASSIGNED: "REASSIGNED",
      STATUS_CHANGE: "STATUS_CHANGE",
      ESCALATED: "ESCALATED",
    },
  };
});

describe("ActivityRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log an activity with correct fields", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: "log-1",
      ticketId: "ticket-1",
      actorId: "user-1",
      action: "CREATED",
      oldValue: null,
      newValue: "Help Desk",
      message: null,
      createdAt: new Date(),
    });

    const prisma = new PrismaClient();
    (prisma as any).activityLog.create = mockCreate;

    const result = await activityRepo.logActivity({
      ticketId: "ticket-1",
      actorId: "user-1",
      action: ActionType.CREATED,
      newValue: "Help Desk",
    });

    expect(result.ticketId).toBe("ticket-1");
    expect(result.action).toBe("CREATED");
    expect(mockCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ticketId: "ticket-1",
        actorId: "user-1",
        action: "CREATED",
        newValue: "Help Desk",
        oldValue: null,
        message: null,
      }),
    });
  });

  it("should retrieve activities for a ticket in chronological order", async () => {
    const mockFindMany = vi.fn().mockResolvedValue([
      { id: "log-1", action: "CREATED", createdAt: new Date("2024-01-01") },
      { id: "log-2", action: "ASSIGNED", createdAt: new Date("2024-01-02") },
    ]);

    const prisma = new PrismaClient();
    (prisma as any).activityLog.findMany = mockFindMany;

    const result = await activityRepo.getTicketActivities("ticket-1");

    expect(result).toHaveLength(2);
    expect(result[0].action).toBe("CREATED");
    expect(result[1].action).toBe("ASSIGNED");
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { ticketId: "ticket-1" },
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
  });
});
