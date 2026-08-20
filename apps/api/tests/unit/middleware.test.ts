import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authenticate } from "../../src/middleware/auth.middleware.js";
import { errorHandler, createError } from "../../src/middleware/error.middleware.js";
import { validate } from "../../src/middleware/validate.middleware.js";
import { z } from "zod";

vi.mock("jsonwebtoken");

describe("AuthMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { headers: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it("should call next with user payload for valid token", () => {
    req.headers = { authorization: "Bearer valid-token" };
    vi.mocked(jwt.verify).mockReturnValue({
      userId: "user-1",
      email: "test@test.com",
      role: "DEPARTMENT_MEMBER",
      departmentId: "dept-1",
    } as any);

    authenticate(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledOnce();
    expect(req.user).toBeDefined();
    expect(req.user?.userId).toBe("user-1");
  });

  it("should return 401 if no token provided", () => {
    req.headers = {};

    authenticate(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "No token provided", code: "UNAUTHORIZED" },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 if token format is invalid", () => {
    req.headers = { authorization: "InvalidFormat" };

    authenticate(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 for invalid/expired token", () => {
    req.headers = { authorization: "Bearer invalid-token" };
    vi.mocked(jwt.verify).mockImplementation(() => {
      throw new Error("Invalid token");
    });

    authenticate(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Invalid token", code: "UNAUTHORIZED" },
    });
  });
});

describe("ErrorMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should handle known errors with custom status code", () => {
    const error = createError("Not found", 404, "NOT_FOUND");

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Not found", code: "NOT_FOUND" },
    });
  });

  it("should handle unknown errors with 500 status", () => {
    const error = new Error("Something went wrong");

    errorHandler(error, req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: "Something went wrong", code: "INTERNAL_ERROR" },
    });
  });
});

describe("ValidateMiddleware", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it("should call next for valid input", () => {
    const schema = z.object({ email: z.string().email() });
    req.body = { email: "test@test.com" };

    validate(schema)(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it("should return 400 for invalid input", () => {
    const schema = z.object({ email: z.string().email() });
    req.body = { email: "not-an-email" };

    validate(schema)(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
