import { describe, it, expect, vi, beforeEach } from "vitest";
import * as userRepo from "../../src/repositories/user.repository.js";
import * as authService from "../../src/services/auth.service.js";

vi.mock("../../src/repositories/user.repository.js");

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(null);
      vi.mocked(userRepo.findDepartmentById).mockResolvedValue({
        id: "dept-1",
        name: "Help Desk",
        slug: "help-desk",
        createdAt: new Date(),
      });
      vi.mocked(userRepo.createUser).mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        name: "Test User",
        passwordHash: "hashed",
        role: "END_USER",
        departmentId: "dept-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.register({
        email: "test@test.com",
        name: "Test User",
        password: "password123",
        departmentId: "dept-1",
      });

      expect(result.user.email).toBe("test@test.com");
      expect(result.token).toBeDefined();
      expect(userRepo.createUser).toHaveBeenCalledOnce();
    });

    it("should throw error if email already exists", async () => {
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue({
        id: "existing",
        email: "test@test.com",
        name: "Existing",
        passwordHash: "hashed",
        role: "END_USER",
        departmentId: "dept-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        authService.register({
          email: "test@test.com",
          name: "Test User",
          password: "password123",
          departmentId: "dept-1",
        })
      ).rejects.toThrow("Email already registered");
    });

    it("should throw error if department not found", async () => {
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(null);
      vi.mocked(userRepo.findDepartmentById).mockResolvedValue(null);

      await expect(
        authService.register({
          email: "test@test.com",
          name: "Test User",
          password: "password123",
          departmentId: "nonexistent",
        })
      ).rejects.toThrow("Department not found");
    });
  });

  describe("login", () => {
    it("should login successfully with valid credentials", async () => {
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        name: "Test User",
        passwordHash: "hashed",
        role: "DEPARTMENT_MEMBER",
        departmentId: "dept-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.login({
        email: "test@test.com",
        password: "password123",
      });

      expect(result.user.email).toBe("test@test.com");
      expect(result.token).toBe("mock-jwt-token");
    });

    it("should throw error if user not found", async () => {
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue(null);

      await expect(
        authService.login({ email: "wrong@test.com", password: "password123" })
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw error if password is invalid", async () => {
      vi.mocked(userRepo.findUserByEmail).mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        name: "Test User",
        passwordHash: "hashed",
        role: "END_USER",
        departmentId: "dept-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const bcrypt = await import("bcryptjs");
      vi.mocked(bcrypt.default.compare).mockResolvedValueOnce(false as any);

      await expect(
        authService.login({ email: "test@test.com", password: "wrong" })
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("getMe", () => {
    it("should return user data", async () => {
      vi.mocked(userRepo.findUserById).mockResolvedValue({
        id: "user-1",
        email: "test@test.com",
        name: "Test User",
        passwordHash: "hashed",
        role: "END_USER",
        departmentId: "dept-1",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await authService.getMe("user-1");
      expect(result.id).toBe("user-1");
      expect(result.email).toBe("test@test.com");
    });

    it("should throw error if user not found", async () => {
      vi.mocked(userRepo.findUserById).mockResolvedValue(null);

      await expect(authService.getMe("nonexistent")).rejects.toThrow("User not found");
    });
  });
});
