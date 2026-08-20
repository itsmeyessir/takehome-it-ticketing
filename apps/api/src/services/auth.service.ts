import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userRepo from "../repositories/user.repository.js";
import { createError } from "../middleware/error.middleware.js";
import { JWT_SECRET, JWT_EXPIRY } from "../config/constants.js";

/**
 * Registers a new user. Always creates END_USER role — department members
 * are seeded, not registered. Returns JWT token for immediate login.
 */
export async function register(data: {
  email: string;
  name: string;
  password: string;
  departmentId: string;
}) {
  const existing = await userRepo.findUserByEmail(data.email);
  if (existing) {
    throw createError("Email already registered", 409, "CONFLICT");
  }

  const department = await userRepo.findDepartmentById(data.departmentId);
  if (!department) {
    throw createError("Department not found", 404, "NOT_FOUND");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await userRepo.createUser({
    email: data.email,
    name: data.name,
    passwordHash,
    role: "END_USER",
    departmentId: data.departmentId,
  });

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, departmentId: user.departmentId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: department.name,
    },
    token,
  };
}

/**
 * Authenticates user by email/password. Returns JWT with userId, email,
 * role, and departmentId embedded. Token expires in 15 minutes.
 */
export async function login(data: { email: string; password: string }) {
  const user = await userRepo.findUserByEmail(data.email);
  if (!user) {
    throw createError("Invalid credentials", 401, "UNAUTHORIZED");
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);
  if (!valid) {
    throw createError("Invalid credentials", 401, "UNAUTHORIZED");
  }

  const department = await userRepo.findDepartmentById(user.departmentId);

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, departmentId: user.departmentId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      departmentName: department?.name || "",
    },
    token,
  };
}

/**
 * Returns the current user's profile. Called by GET /api/auth/me
 * to refresh user data from the database (not from the stale JWT).
 */
export async function getMe(userId: string) {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    throw createError("User not found", 404, "NOT_FOUND");
  }

  const department = await userRepo.findDepartmentById(user.departmentId);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    departmentId: user.departmentId,
    departmentName: department?.name || "",
  };
}

/**
 * Updates the current user's profile (name, email, department).
 * Returns the updated user data for localStorage sync.
 */
export async function updateProfile(
  userId: string,
  data: { name?: string; email?: string; departmentId?: string }
) {
  const user = await userRepo.findUserById(userId);
  if (!user) {
    throw createError("User not found", 404, "NOT_FOUND");
  }

  // Check if email is taken by another user
  if (data.email && data.email !== user.email) {
    const existing = await userRepo.findUserByEmail(data.email);
    if (existing) {
      throw createError("Email already in use", 409, "CONFLICT");
    }
  }

  // Validate department exists if changing
  if (data.departmentId && data.departmentId !== user.departmentId) {
    const dept = await userRepo.findDepartmentById(data.departmentId);
    if (!dept) {
      throw createError("Department not found", 404, "NOT_FOUND");
    }
  }

  const updated = await userRepo.updateUser(userId, data);
  const department = await userRepo.findDepartmentById(updated.departmentId);

  return {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
    departmentId: updated.departmentId,
    departmentName: department?.name || "",
  };
}
