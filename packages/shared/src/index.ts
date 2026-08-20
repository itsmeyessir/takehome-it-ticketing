export type Role = "END_USER" | "DEPARTMENT_MEMBER";

export type TicketStatus = "OPEN" | "IN_PROGRESS" | "ESCALATED" | "RESOLVED" | "CLOSED";

export type ActionType = "CREATED" | "ASSIGNED" | "REASSIGNED" | "STATUS_CHANGE" | "ESCALATED";

export const STATUS_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ["IN_PROGRESS", "ESCALATED", "CLOSED"],
  IN_PROGRESS: ["OPEN", "ESCALATED", "RESOLVED", "CLOSED"],
  ESCALATED: ["OPEN", "IN_PROGRESS"],
  RESOLVED: ["CLOSED", "OPEN"],
  CLOSED: [],
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  departmentId: string;
  departmentName?: string;
}

export interface CurrentUser extends User {
  departmentName: string;
}

export interface Department {
  id: string;
  name: string;
  slug: string;
}

export interface TicketType {
  id: string;
  name: string;
  description?: string;
}

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  typeId: string;
  createdById: string;
  currentDepartmentId: string;
  assignedToId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketWithDetails extends Ticket {
  createdBy: Pick<User, "id" | "name" | "email">;
  assignedTo?: Pick<User, "id" | "name" | "email">;
  currentDepartment: Pick<Department, "id" | "name" | "slug">;
  ticketType: Pick<TicketType, "id" | "name">;
  activities?: ActivityLogEntry[];
}

export interface ActivityLogEntry {
  id: string;
  ticketId: string;
  actorId: string;
  action: ActionType;
  oldValue?: string;
  newValue?: string;
  message?: string;
  createdAt: string;
  actor: Pick<User, "id" | "name" | "email">;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    message: string;
    code: string;
  };
}

export interface DepartmentTickets {
  unassigned: TicketWithDetails[];
  assigned: TicketWithDetails[];
}
