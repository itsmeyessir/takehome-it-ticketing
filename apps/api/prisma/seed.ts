import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Departments
  const helpDesk = await prisma.department.upsert({
    where: { slug: "help-desk" },
    update: {},
    create: { name: "Help Desk", slug: "help-desk" },
  });

  const tier2 = await prisma.department.upsert({
    where: { slug: "tier-2-support" },
    update: {},
    create: { name: "Tier 2 Support", slug: "tier-2-support" },
  });

  const infrastructure = await prisma.department.upsert({
    where: { slug: "infrastructure" },
    update: {},
    create: { name: "Infrastructure", slug: "infrastructure" },
  });

  const marketing = await prisma.department.upsert({
    where: { slug: "marketing" },
    update: {},
    create: { name: "Marketing", slug: "marketing" },
  });

  console.log("Departments created");

  // Ticket Types
  const hwType = await prisma.ticketType.upsert({
    where: { id: "hw-type" },
    update: {},
    create: { id: "hw-type", name: "IT Hardware", description: "Hardware issues and requests" },
  });

  const swType = await prisma.ticketType.upsert({
    where: { id: "sw-type" },
    update: {},
    create: { id: "sw-type", name: "Software Request", description: "Software installation and licensing" },
  });

  const accessType = await prisma.ticketType.upsert({
    where: { id: "access-type" },
    update: {},
    create: { id: "access-type", name: "Access Request", description: "System access and permissions" },
  });

  console.log("Ticket types created");

  // Users
  const password = await bcrypt.hash("password123", 12);

  const angelo = await prisma.user.upsert({
    where: { email: "angelo@company.com" },
    update: {},
    create: {
      email: "angelo@company.com",
      name: "Angelo Tamparong",
      passwordHash: password,
      role: Role.DEPARTMENT_MEMBER,
      departmentId: helpDesk.id,
    },
  });

  const dhan = await prisma.user.upsert({
    where: { email: "dhan@company.com" },
    update: {},
    create: {
      email: "dhan@company.com",
      name: "Dhan Marano",
      passwordHash: password,
      role: Role.DEPARTMENT_MEMBER,
      departmentId: helpDesk.id,
    },
  });

  const andrew = await prisma.user.upsert({
    where: { email: "andrew@company.com" },
    update: {},
    create: {
      email: "andrew@company.com",
      name: "Andrew Basilio",
      passwordHash: password,
      role: Role.DEPARTMENT_MEMBER,
      departmentId: tier2.id,
    },
  });

  const aljean = await prisma.user.upsert({
    where: { email: "aljean@company.com" },
    update: {},
    create: {
      email: "aljean@company.com",
      name: "Aljean Bonilla",
      passwordHash: password,
      role: Role.DEPARTMENT_MEMBER,
      departmentId: tier2.id,
    },
  });

  const jasper = await prisma.user.upsert({
    where: { email: "jasper@company.com" },
    update: {},
    create: {
      email: "jasper@company.com",
      name: "Jasper Pastrana",
      passwordHash: password,
      role: Role.DEPARTMENT_MEMBER,
      departmentId: infrastructure.id,
    },
  });

  const iber = await prisma.user.upsert({
    where: { email: "iber@company.com" },
    update: {},
    create: {
      email: "iber@company.com",
      name: "Iber Fat",
      passwordHash: password,
      role: Role.END_USER,
      departmentId: marketing.id,
    },
  });

  console.log("Users created");

  // Clean up existing tickets and activity logs for idempotent seeding
  await prisma.activityLog.deleteMany();
  await prisma.ticket.deleteMany();

  // Sample Tickets
  const ticket1 = await prisma.ticket.create({
    data: {
      title: "Laptop screen flickering",
      description: "My laptop screen keeps flickering every few minutes. It started after the last Windows update. Model: Dell Latitude 5520.",
      status: "IN_PROGRESS",
      typeId: hwType.id,
      createdById: iber.id,
      currentDepartmentId: helpDesk.id,
      assignedToId: angelo.id,
    },
  });

  const ticket2 = await prisma.ticket.create({
    data: {
      title: "Request Photoshop license",
      description: "Need Adobe Photoshop installed for the upcoming campaign materials. Please include the full Creative Suite if possible.",
      status: "OPEN",
      typeId: swType.id,
      createdById: iber.id,
      currentDepartmentId: helpDesk.id,
    },
  });

  const ticket3 = await prisma.ticket.create({
    data: {
      title: "VPN access for remote work",
      description: "I need VPN access to connect to the internal network from home. I work hybrid 3 days a week.",
      status: "ESCALATED",
      typeId: accessType.id,
      createdById: iber.id,
      currentDepartmentId: tier2.id,
      assignedToId: null,
    },
  });

  const ticket4 = await prisma.ticket.create({
    data: {
      title: "New keyboard and mouse request",
      description: "My current keyboard has several keys not working. Need a replacement mechanical keyboard and wireless mouse.",
      status: "RESOLVED",
      typeId: hwType.id,
      createdById: iber.id,
      currentDepartmentId: helpDesk.id,
      assignedToId: dhan.id,
    },
  });

  const ticket5 = await prisma.ticket.create({
    data: {
      title: "Slack desktop app crashing",
      description: "Slack keeps crashing on startup after the latest update. Error: 'SIGSEGV in main process'. Already tried reinstalling.",
      status: "IN_PROGRESS",
      typeId: swType.id,
      createdById: iber.id,
      currentDepartmentId: tier2.id,
      assignedToId: andrew.id,
    },
  });

  console.log("Tickets created");

  // Activity Logs
  await prisma.activityLog.createMany({
    data: [
      // Ticket 1: Laptop flickering
      { ticketId: ticket1.id, actorId: iber.id, action: "CREATED" },
      { ticketId: ticket1.id, actorId: angelo.id, action: "ASSIGNED", oldValue: "Unassigned", newValue: "Angelo Tamparong" },
      { ticketId: ticket1.id, actorId: angelo.id, action: "STATUS_CHANGE", oldValue: "OPEN", newValue: "IN_PROGRESS" },

      // Ticket 2: Photoshop license
      { ticketId: ticket2.id, actorId: iber.id, action: "CREATED" },

      // Ticket 3: VPN access
      { ticketId: ticket3.id, actorId: iber.id, action: "CREATED" },
      { ticketId: ticket3.id, actorId: dhan.id, action: "ESCALATED", oldValue: "Help Desk", newValue: "Tier 2 Support", message: "Requires higher-level access approval from network team" },

      // Ticket 4: Keyboard (resolved)
      { ticketId: ticket4.id, actorId: iber.id, action: "CREATED" },
      { ticketId: ticket4.id, actorId: dhan.id, action: "ASSIGNED", oldValue: "Unassigned", newValue: "Dhan Marano" },
      { ticketId: ticket4.id, actorId: dhan.id, action: "STATUS_CHANGE", oldValue: "OPEN", newValue: "IN_PROGRESS" },
      { ticketId: ticket4.id, actorId: dhan.id, action: "STATUS_CHANGE", oldValue: "IN_PROGRESS", newValue: "RESOLVED", message: "Replacement delivered to desk 4B" },

      // Ticket 5: Slack crashing
      { ticketId: ticket5.id, actorId: iber.id, action: "CREATED" },
      { ticketId: ticket5.id, actorId: angelo.id, action: "ASSIGNED", oldValue: "Unassigned", newValue: "Angelo Tamparong" },
      { ticketId: ticket5.id, actorId: angelo.id, action: "ESCALATED", oldValue: "Help Desk", newValue: "Tier 2 Support", message: "Software-level issue, needs deeper investigation" },
      { ticketId: ticket5.id, actorId: andrew.id, action: "ASSIGNED", oldValue: "Unassigned", newValue: "Andrew Basilio" },
      { ticketId: ticket5.id, actorId: andrew.id, action: "STATUS_CHANGE", oldValue: "OPEN", newValue: "IN_PROGRESS" },
    ],
  });

  console.log("Activity logs created");
  console.log("\nSeed complete! Login credentials:");
  console.log("─────────────────────────────────────");
  console.log("Angelo Tamparong  | angelo@company.com  | Help Desk (DEPARTMENT_MEMBER)");
  console.log("Dhan Marano       | dhan@company.com    | Help Desk (DEPARTMENT_MEMBER)");
  console.log("Andrew Basilio    | andrew@company.com  | Tier 2 Support (DEPARTMENT_MEMBER)");
  console.log("Aljean Bonilla    | aljean@company.com  | Tier 2 Support (DEPARTMENT_MEMBER)");
  console.log("Jasper Pastrana   | jasper@company.com  | Infrastructure (DEPARTMENT_MEMBER)");
  console.log("Iber Fat          | iber@company.com    | Marketing (END_USER)");
  console.log("─────────────────────────────────────");
  console.log("Password for all: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
