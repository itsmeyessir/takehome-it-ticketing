import { describe, it, expect, vi, beforeEach } from "vitest";
import * as ticketRepo from "../../src/repositories/ticket.repository.js";
import * as userRepo from "../../src/repositories/user.repository.js";
import * as activityRepo from "../../src/repositories/activity.repository.js";

vi.mock("../../src/repositories/ticket.repository.js");
vi.mock("../../src/repositories/user.repository.js");
vi.mock("../../src/repositories/activity.repository.js");

const mockDepartment = {
  id: "dept-1",
  name: "Help Desk",
  slug: "help-desk",
  createdAt: new Date(),
};

const mockTicket = {
  id: "ticket-1",
  title: "Test Ticket",
  description: "Test description",
  status: "OPEN",
  typeId: "hw-type",
  createdById: "user-1",
  currentDepartmentId: "dept-1",
  assignedToId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: { id: "user-1", name: "User 1", email: "user1@test.com" },
  assignedTo: null,
  currentDepartment: { id: "dept-1", name: "Help Desk", slug: "help-desk" },
  ticketType: { id: "hw-type", name: "IT Hardware" },
};

describe("Repository Layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Department queries", () => {
    it("should find all departments", async () => {
      vi.mocked(userRepo.findAllDepartments).mockResolvedValue([mockDepartment]);
      const result = await userRepo.findAllDepartments();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Help Desk");
    });

    it("should find department members", async () => {
      vi.mocked(userRepo.findDepartmentMembers).mockResolvedValue([
        { id: "user-1", name: "Alice", email: "alice@test.com", role: "DEPARTMENT_MEMBER" },
      ]);
      const result = await userRepo.findDepartmentMembers("dept-1");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Alice");
    });
  });

  describe("Ticket queries", () => {
    it("should find tickets by department", async () => {
      vi.mocked(ticketRepo.findTicketsByDepartment).mockResolvedValue([
        { ...mockTicket },
        { ...mockTicket, id: "ticket-2", assignedToId: "user-2" },
      ]);
      const result = await ticketRepo.findTicketsByDepartment("dept-1");
      expect(result).toHaveLength(2);
      expect(result[0].assignedToId).toBeNull();
      expect(result[1].assignedToId).toBe("user-2");
    });

    it("should find tickets by user", async () => {
      vi.mocked(ticketRepo.findTicketsByUser).mockResolvedValue([mockTicket]);
      const result = await ticketRepo.findTicketsByUser("user-1");
      expect(result).toHaveLength(1);
      expect(result[0].createdById).toBe("user-1");
    });

    it("should find ticket by id with relations", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue(mockTicket);
      const result = await ticketRepo.findTicketById("ticket-1");
      expect(result).not.toBeNull();
      expect(result?.createdBy.name).toBe("User 1");
      expect(result?.ticketType.name).toBe("IT Hardware");
    });

    it("should create a ticket", async () => {
      vi.mocked(ticketRepo.createTicket).mockResolvedValue({
        ...mockTicket,
        id: "new-ticket",
      });
      const result = await ticketRepo.createTicket({
        title: "New Ticket",
        description: "Description",
        typeId: "hw-type",
        createdById: "user-1",
        currentDepartmentId: "dept-1",
      });
      expect(result.id).toBe("new-ticket");
    });

    it("should update ticket status", async () => {
      vi.mocked(ticketRepo.updateTicketStatus).mockResolvedValue({
        ...mockTicket,
        status: "IN_PROGRESS",
      });
      const result = await ticketRepo.updateTicketStatus("ticket-1", "IN_PROGRESS");
      expect(result.status).toBe("IN_PROGRESS");
    });

    it("should assign ticket", async () => {
      vi.mocked(ticketRepo.assignTicket).mockResolvedValue({
        ...mockTicket,
        assignedToId: "user-2",
      });
      const result = await ticketRepo.assignTicket("ticket-1", "user-2");
      expect(result.assignedToId).toBe("user-2");
    });

    it("should escalate ticket to new department", async () => {
      vi.mocked(ticketRepo.escalateTicket).mockResolvedValue({
        ...mockTicket,
        status: "ESCALATED",
        currentDepartmentId: "dept-2",
        assignedToId: null,
      });
      const result = await ticketRepo.escalateTicket("ticket-1", "dept-2");
      expect(result.status).toBe("ESCALATED");
      expect(result.currentDepartmentId).toBe("dept-2");
      expect(result.assignedToId).toBeNull();
    });
  });

  describe("Activity log queries", () => {
    it("should log an activity", async () => {
      vi.mocked(activityRepo.logActivity).mockResolvedValue({
        id: "log-1",
        ticketId: "ticket-1",
        actorId: "user-1",
        action: "CREATED",
        oldValue: null,
        newValue: "Help Desk",
        message: null,
        createdAt: new Date(),
      });
      const result = await activityRepo.logActivity({
        ticketId: "ticket-1",
        actorId: "user-1",
        action: "CREATED",
        newValue: "Help Desk",
      });
      expect(result.action).toBe("CREATED");
    });

    it("should get ticket activities in order", async () => {
      vi.mocked(activityRepo.getTicketActivities).mockResolvedValue([
        { id: "log-1", action: "CREATED", createdAt: new Date("2024-01-01") } as any,
        { id: "log-2", action: "ASSIGNED", createdAt: new Date("2024-01-02") } as any,
      ]);
      const result = await activityRepo.getTicketActivities("ticket-1");
      expect(result).toHaveLength(2);
      expect(result[0].action).toBe("CREATED");
      expect(result[1].action).toBe("ASSIGNED");
    });
  });
});
