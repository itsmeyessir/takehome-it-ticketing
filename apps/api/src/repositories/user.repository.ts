import { prisma } from "../config/db.js";
import { User } from "@prisma/client";

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(data: {
  email: string;
  name: string;
  passwordHash: string;
  role: string;
  departmentId: string;
}): Promise<User> {
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role as any,
      departmentId: data.departmentId,
    },
  });
}

export async function findDepartmentById(id: string) {
  return prisma.department.findUnique({ where: { id } });
}

export async function findAllDepartments() {
  return prisma.department.findMany({ orderBy: { name: "asc" } });
}

export async function findDepartmentMembers(departmentId: string) {
  return prisma.user.findMany({
    where: { departmentId },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; departmentId?: string }
) {
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, role: true, departmentId: true },
  });
}
