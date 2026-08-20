import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "../lib/auth";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

describe("Auth utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("setToken should store token in localStorage", () => {
    auth.setToken("my-token");
    expect(localStorageMock.setItem).toHaveBeenCalledWith("token", "my-token");
  });

  it("getToken should retrieve token from localStorage", () => {
    localStorageMock.getItem.mockReturnValue("stored-token");
    const token = auth.getToken();
    expect(token).toBe("stored-token");
  });

  it("getToken should return null when no token exists", () => {
    localStorageMock.getItem.mockReturnValue(null);
    const token = auth.getToken();
    expect(token).toBeNull();
  });

  it("removeToken should clear token from localStorage", () => {
    auth.removeToken();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("token");
  });
});
