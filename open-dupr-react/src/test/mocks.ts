import { vi } from "vitest";

export const mockApi = {
  getMyProfile: vi.fn(),
  searchPlayers: vi.fn(),
  getFollowers: vi.fn(),
  getFollowing: vi.fn(),
  saveMatch: vi.fn(),
};

vi.mock("@/lib/api", () => mockApi);
