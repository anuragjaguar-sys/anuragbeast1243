import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import { StorageManager } from "@/lib/core/storage-manager";
import { CloudSyncService } from "@/lib/core/sync-service";
import { supabase } from "@/lib/supabase";

// In-memory mock for localStorage and window in Node environment
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

const localStorageMock = createLocalStorageMock();

beforeAll(() => {
  (globalThis as any).window = {
    localStorage: localStorageMock,
  };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

describe("StorageManager", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("safely writes and reads back JSON objects", () => {
    const payload = { title: "Emergency Fund", targetAmount: 500000 };
    StorageManager.set(StorageManager.KEYS.GOALS, payload);

    const retrieved = StorageManager.get(StorageManager.KEYS.GOALS, null);
    expect(retrieved).toEqual(payload);
  });

  it("returns fallback value when key does not exist", () => {
    const fallback = { fallback: true };
    const res = StorageManager.get("non_existent_key", fallback);
    expect(res).toEqual(fallback);
  });

  it("removes keys correctly", () => {
    StorageManager.set("test_key", { data: 123 });
    expect(StorageManager.get("test_key", null)).toEqual({ data: 123 });

    StorageManager.remove("test_key");
    expect(StorageManager.get("test_key", null)).toBeNull();
  });
});

describe("CloudSyncService", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it("returns false if user is unauthenticated", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: null },
      error: null,
    } as any);

    const pulled = await CloudSyncService.pullRemoteState();
    expect(pulled).toBe(false);

    const pushed = await CloudSyncService.pushStore("goals", []);
    expect(pushed).toBe(false);
  });

  it("hydrates StorageManager on pullRemoteState when user is authenticated", async () => {
    const mockUser = { id: "user_123" };
    const remoteData = {
      goals: [{ id: "g1", title: "Retire early" }],
      portfolio: [{ assetClass: "Equity", value: 1000000 }],
    };

    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });

    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { data: remoteData },
      error: null,
    });

    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any);

    const success = await CloudSyncService.pullRemoteState();
    expect(success).toBe(true);

    const localGoals = StorageManager.get(StorageManager.KEYS.GOALS, null);
    const localPortfolio = StorageManager.get(StorageManager.KEYS.PORTFOLIO, null);

    expect(localGoals).toEqual(remoteData.goals);
    expect(localPortfolio).toEqual(remoteData.portfolio);
  });
});
