import { describe, it, expect, vi, beforeEach } from "vitest";
import { api } from "../lib/api";

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should make GET request with token", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: "1", name: "Test" } }),
    });

    const result = await api.get("/test", "my-token");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/test",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer my-token",
        }),
      })
    );
    expect(result).toEqual({ id: "1", name: "Test" });
  });

  it("should make POST request with body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { success: true } }),
    });

    const result = await api.post("/test", { foo: "bar" }, "token");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/test",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ foo: "bar" }),
      })
    );
    expect(result).toEqual({ success: true });
  });

  it("should throw error on failed request", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: "Not found", code: "NOT_FOUND" } }),
    });

    await expect(api.get("/nonexistent", "token")).rejects.toThrow("Not found");
  });

  it("should make PATCH request", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { updated: true } }),
    });

    await api.patch("/test/1", { status: "OPEN" }, "token");

    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/test/1",
      expect.objectContaining({ method: "PATCH" })
    );
  });
});
