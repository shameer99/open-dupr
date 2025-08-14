import { render, screen, within, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RecordMatchPage from "./RecordMatchPage";
import { mockApi } from "@/test/mocks";
import { vi } from "vitest";

describe("RecordMatchPage", () => {
  beforeEach(() => {
    mockApi.getMyProfile.mockResolvedValue({
      result: {
        id: 1,
        fullName: "Test User",
        imageUrl: "",
      },
    });
    mockApi.searchPlayers.mockResolvedValue({ result: { hits: [] } });
    mockApi.getFollowers.mockResolvedValue({ results: [] });
    mockApi.getFollowing.mockResolvedValue({ results: [] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not display the step text on the first step", async () => {
    render(
      <MemoryRouter>
        <RecordMatchPage />
      </MemoryRouter>
    );

    await screen.findByText("Add Match");

    const addMatchHeading = screen.getByText("Add Match");
    const parent = addMatchHeading.parentElement;
    expect(parent).not.toBeNull();
    if (parent) {
      const { queryByText } = within(parent);
      expect(queryByText("Step 1 of 2")).toBeNull();
    }
  });

  it("should not display the step text on the second step", async () => {
    // Mock that we found an opponent
    mockApi.searchPlayers.mockResolvedValue({
      result: {
        hits: [
          {
            id: 2,
            fullName: "Opponent Player",
            imageUrl: "",
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <RecordMatchPage />
      </MemoryRouter>
    );

    // Wait for the page to load
    await screen.findByText("Add Match");

    // Add an opponent
    const addOpponentButton = await screen.findByText("Add Opponent");
    fireEvent.click(addOpponentButton);

    const opponentPlayer = await screen.findByText("Opponent Player");
    fireEvent.click(opponentPlayer);

    // Click the next button
    const nextButton = await screen.findByText("Next");
    fireEvent.click(nextButton);

    // Check that the "Step 2 of 2" text is not present
    await screen.findByText("Match Score");
    const matchScoreHeading = screen.getByText("Match Score");
    const parent = matchScoreHeading.parentElement;
    expect(parent).not.toBeNull();
    if (parent) {
      const { queryByText } = within(parent);
      expect(queryByText("Step 2 of 2")).toBeNull();
    }
  });
});
