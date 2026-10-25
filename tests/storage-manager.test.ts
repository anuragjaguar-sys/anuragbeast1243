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
    dispatchEvent: vi.fn(),
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
    expect(StorageManager.has("non_existent_key")).toBe(false);
  });

  it("distinguishes an intentional empty value from a missing key", () => {
    StorageManager.set("empty_collection", []);

    expect(StorageManager.has("empty_collection")).toBe(true);
    expect(StorageManager.get("empty_collection", ["fallback"])).toEqual([]);
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

    const remoteRows = [
      {
        store_key: "goals",
        payload: { data: remoteData.goals, updatedAt: 100 },
      },
      {
        store_key: "portfolio",
        payload: { data: remoteData.portfolio, updatedAt: 100 },
      },
    ];

    const mockEq = vi.fn().mockResolvedValue({
      data: remoteRows,
      error: null,
    });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

    const mockProfileMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    });
    const mockProfileSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({ maybeSingle: mockProfileMaybeSingle }),
    });

    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === "profiles") return { select: mockProfileSelect } as any;
      return { select: mockSelect } as any;
    });

    const success = await CloudSyncService.pullRemoteState();
    expect(success).toBe(true);

    const localGoals = StorageManager.get(StorageManager.KEYS.GOALS, null);
    const localPortfolio = StorageManager.get(StorageManager.KEYS.PORTFOLIO, null);

    expect(localGoals).toEqual(remoteData.goals);
    expect(localPortfolio).toEqual(remoteData.portfolio);
  });

  it("keeps a newer local edit when an older remote version arrives", async () => {
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: "user_123" } as any },
      error: null,
    });

    StorageManager.set(StorageManager.KEYS.GOALS, [{ id: "local" }]);
    StorageManager.set("goals_sync_meta", {
      version: 1,
      data: [{ id: "local" }],
      updatedAt: 200,
    });

    const remoteEq = vi.fn().mockResolvedValue({
      data: [
        {
          store_key: "goals",
          payload: { version: 1, data: [{ id: "remote" }], updatedAt: 100 },
          updated_at: "1970-01-01T00:00:00.100Z",
        },
      ],
      error: null,
    });
    const profileEq = vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    vi.mocked(supabase.from).mockImplementation((table) =>
      table === "profiles"
        ? ({ select: vi.fn().mockReturnValue({ eq: profileEq }) } as any)
        : ({ select: vi.fn().mockReturnValue({ eq: remoteEq }) } as any)
    );

    await expect(CloudSyncService.pullRemoteState()).resolves.toBe(true);
    expect(StorageManager.get(StorageManager.KEYS.GOALS, [])).toEqual([
      { id: "local" },
    ]);
  });
});
