import { CloudSyncService } from "@/lib/core/sync-service";
import type { PortfolioItem } from "../types";
import { StorageManager } from "@/lib/core/storage-manager";

const PRIMARY_KEY = StorageManager.KEYS.PORTFOLIO;
const LEGACY_KEY = "athena-portfolio";

export function loadPortfolio(): PortfolioItem[] {
  // Check primary unified key
  const portfolio = StorageManager.get<PortfolioItem[]>(PRIMARY_KEY, []);
  // An empty array is an intentional, synced deletion marker. It must not
  // fall through to stale legacy data and resurrect removed holdings.
  if (StorageManager.has(PRIMARY_KEY) && Array.isArray(portfolio)) {
    return portfolio;
  }

  // Check sync shorthand key
  const syncPortfolio = StorageManager.get<PortfolioItem[]>("portfolio", []);
  if (Array.isArray(syncPortfolio) && syncPortfolio.length > 0) {
    StorageManager.set(PRIMARY_KEY, syncPortfolio);
    return syncPortfolio;
  }

  // Legacy key fallback
  const legacyPortfolio = StorageManager.get<PortfolioItem[]>(LEGACY_KEY, []);
  if (Array.isArray(legacyPortfolio) && legacyPortfolio.length > 0) {
    StorageManager.set(PRIMARY_KEY, legacyPortfolio);
    return legacyPortfolio;
  }

  return [];
}

export function savePortfolio(portfolio: PortfolioItem[]): void {
  StorageManager.set(PRIMARY_KEY, portfolio);
  StorageManager.set("portfolio", portfolio);
  void CloudSyncService.pushStore("portfolio", portfolio);
}

export function clearPortfolio(): void {
  savePortfolio([]);
  StorageManager.remove(LEGACY_KEY);
}
