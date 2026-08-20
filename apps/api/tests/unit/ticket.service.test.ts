import { describe, it, expect, vi, beforeEach } from "vitest";
import * as ticketRepo from "../../src/repositories/ticket.repository.js";
import * as activityRepo from "../../src/repositories/activity.repository.js";
import * as userRepo from "../../src/repositories/user.repository.js";
import * as ticketService from "../../src/services/ticket.service.js";

vi.mock("../../src/repositories/ticket.repository.js");
vi.mock("../../src/repositories/activity.repository.js");
vi.mock("../../src/repositories/user.repository.js");

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

const mockDepartments = [
  { id: "dept-1", name: "Help Desk", slug: "help-desk", createdAt: new Date() },
  { id: "dept-2", name: "Tier 2 Support", slug: "tier-2-support", createdAt: new Date() },
  { id: "dept-3", name: "Infrastructure", slug: "infrastructure", createdAt: new Date() },
];

const mockTicketTypes = [
  { id: "hw-type", name: "IT Hardware", description: "Hardware", createdAt: new Date() },
  { id: "sw-type", name: "Software Request", description: "Software", createdAt: new Date() },
];

describe("TicketService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userRepo.findAllDepartments).mockResolvedValue(mockDepartments);
    vi.mocked(ticketRepo.findAllTicketTypes).mockResolvedValue(mockTicketTypes);
  });

  describe("createTicket", () => {
    it("should create a ticket in the first pipeline department", async () => {
      vi.mocked(ticketRepo.createTicket).mockResolvedValue({
        ...mockTicket,
        id: "new-ticket",
      });

      const result = await ticketService.createTicket(
        { title: "New Ticket", description: "Description", typeId: "hw-type" },
        "user-1",
        "dept-1"
      );

      expect(result.id).toBe("new-ticket");
      expect(ticketRepo.createTicket).toHaveBeenCalledWith(
        expect.objectContaining({
          currentDepartmentId: "dept-1",
          createdById: "user-1",
        })
      );
      expect(activityRepo.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ action: "CREATED" })
      );
    });

    it("should throw error for invalid ticket type", async () => {
      await expect(
        ticketService.createTicket(
          { title: "Test", description: "Desc", typeId: "nonexistent" },
          "user-1",
          "dept-1"
        )
      ).rejects.toThrow("Ticket type not found");
    });
  });

  describe("getTicket", () => {
    it("should return ticket for the creator (end user)", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue(mockTicket);

      const result = await ticketService.getTicket("ticket-1", "user-1", "END_USER", "dept-1");
      expect(result.id).toBe("ticket-1");
    });

    it("should deny access if end user is not the creator", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue(mockTicket);

      await expect(
        ticketService.getTicket("ticket-1", "other-user", "END_USER", "dept-1")
      ).rejects.toThrow("Access denied");
    });

    it("should deny access if ticket not in member's department and not creator", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue(mockTicket);

      await expect(
        ticketService.getTicket("ticket-1", "other-user", "DEPARTMENT_MEMBER", "dept-2")
      ).rejects.toThrow("Access denied");
    });

    it("should throw error if ticket not found", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue(null);

      await expect(
        ticketService.getTicket("nonexistent", "user-1", "END_USER", "dept-1")
      ).rejects.toThrow("Ticket not found");
    });
  });

  describe("assignTicket", () => {
    it("should assign ticket to a member in the same department", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue(mockTicket);
      vi.mocked(userRepo.findUserById).mockResolvedValue({
        id: "assignee-1",
        email: "assignee@test.com",
        name: "Assignee",
        passwordHash: "hashed",
        role: "DEPARTMENT_MEMBER",
        departmentId: "dept-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      vi.mocked(ticketRepo.assignTicket).mockResolvedValue({
        ...mockTicket,
        assignedToId: "assignee-1",
      });

      const result = await ticketService.assignTicket(
        "ticket-1",
        "assignee-1",
        "user-1",
        "dept-1"
      );

      expect(result.assignedToId).toBe("assignee-1");
      expect(activityRepo.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({ action: "ASSIGNED" })
      );
    });

    it("should deny assignment if ticket not in actor's department", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue(mockTicket);

      await expect(
        ticketService.assignTicket("ticket-1", "assignee-1", "user-1", "dept-2")
      ).rejects.toThrow("Ticket not in your department");
    });

    it("should deny assignment to user in different department", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue(mockTicket);
      vi.mocked(userRepo.findUserById).mockResolvedValue({
        id: "assignee-1",
        email: "assignee@test.com",
        name: "Assignee",
        passwordHash: "hashed",
        role: "DEPARTMENT_MEMBER",
        departmentId: "dept-2",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        ticketService.assignTicket("ticket-1", "assignee-1", "user-1", "dept-1")
      ).rejects.toThrow("Assignee not in your department");
    });
  });

  describe("updateTicketStatus", () => {
    it("should update status with valid transition", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue(mockTicket);
      vi.mocked(ticketRepo.updateTicketStatus).mockResolvedValue({
        ...mockTicket,
        status: "IN_PROGRESS",
      });

      const result = await ticketService.updateTicketStatus(
        "ticket-1",
        "IN_PROGRESS",
        "Starting work",
        "user-1",
        "dept-1"
      );

      expect(result.status).toBe("IN_PROGRESS");
      expect(activityRepo.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "STATUS_CHANGE",
          oldValue: "OPEN",
          newValue: "IN_PROGRESS",
        })
      );
    });

    it("should reject invalid status transition", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue({
        ...mockTicket,
        status: "CLOSED",
      });

      await expect(
        ticketService.updateTicketStatus(
          "ticket-1",
          "IN_PROGRESS",
          undefined,
          "user-1",
          "dept-1"
        )
      ).rejects.toThrow("Cannot transition from CLOSED to IN_PROGRESS");
    });
  });

  describe("escalateTicket", () => {
    it("should escalate ticket to next department in pipeline", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue(mockTicket);
      vi.mocked(userRepo.findDepartmentById).mockResolvedValue(mockDepartments[0]);
      vi.mocked(ticketRepo.escalateTicket).mockResolvedValue({
        ...mockTicket,
        status: "ESCALATED",
        currentDepartmentId: "dept-2",
        assignedToId: null,
      });

      const result = await ticketService.escalateTicket(
        "ticket-1",
        "Needs higher-level support",
        "user-1",
        "dept-1"
      );

      expect(result.status).toBe("ESCALATED");
      expect(result.assignedToId).toBeNull();
      expect(ticketRepo.escalateTicket).toHaveBeenCalledWith("ticket-1", "dept-2");
      expect(activityRepo.logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "ESCALATED",
          oldValue: "Help Desk",
          newValue: "Tier 2 Support",
          message: "Needs higher-level support",
        })
      );
    });

    it("should deny escalation if ticket not in actor's department", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue(mockTicket);

      await expect(
        ticketService.escalateTicket("ticket-1", undefined, "user-1", "dept-2")
      ).rejects.toThrow("Ticket not in your department");
    });

    it("should deny escalation at last pipeline department", async () => {
      vi.mocked(ticketRepo.findTicketById).mockResolvedValue({
        ...mockTicket,
        currentDepartmentId: "dept-3",
        assignedTo: null,
        createdBy: mockTicket.createdBy,
        currentDepartment: { id: "dept-3", name: "Infrastructure", slug: "infrastructure" },
        ticketType: mockTicket.ticketType,
      });
      vi.mocked(userRepo.findDepartmentById).mockResolvedValue(mockDepartments[2]);

      await expect(
        ticketService.escalateTicket("ticket-1", undefined, "user-1", "dept-3")
      ).rejects.toThrow("last department");
    });
  });
});
