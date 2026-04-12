import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultsGallery } from "../results-gallery";

const mockGenerations = [
  {
    id: "gen-1",
    provider: "Luma",
    status: "COMPLETED",
    videoUrl: "https://r2.dev/luma.mp4",
  },
  {
    id: "gen-2",
    provider: "Runway",
    status: "GENERATING",
    videoUrl: null,
  },
  {
    id: "gen-3",
    provider: "Veo",
    status: "FAILED",
    errorMessage: "Timeout",
  },
  {
    id: "gen-4",
    provider: "Kling",
    status: "PENDING",
    videoUrl: null,
  },
  {
    id: "gen-5",
    provider: "MiniMax",
    status: "COMPLETED",
    videoUrl: "https://r2.dev/minimax.mp4",
  },
];

describe("ResultsGallery", () => {
  it("renders all provider cards", () => {
    render(<ResultsGallery generations={mockGenerations} />);

    expect(screen.getByText("Luma")).toBeInTheDocument();
    expect(screen.getByText("Runway")).toBeInTheDocument();
    expect(screen.getByText("Veo")).toBeInTheDocument();
    expect(screen.getByText("Kling")).toBeInTheDocument();
    expect(screen.getByText("MiniMax")).toBeInTheDocument();
  });

  it("sorts completed first", () => {
    render(<ResultsGallery generations={mockGenerations} />);

    const cards = screen.getAllByTestId(/generation-card-/);
    // First two should be completed providers (Luma and MiniMax)
    const firstTwo = cards.slice(0, 2).map((c) => c.getAttribute("data-testid"));
    expect(firstTwo).toContain("generation-card-Luma");
    expect(firstTwo).toContain("generation-card-MiniMax");
  });

  it("shows video preview when a completed card is clicked", async () => {
    const user = userEvent.setup();
    render(<ResultsGallery generations={mockGenerations} />);

    await user.click(screen.getByTestId("generation-card-Luma"));

    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(screen.getByTestId("video-player")).toBeInTheDocument();
    expect(screen.getByText("Download Video")).toBeInTheDocument();
  });

  it("closes preview when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<ResultsGallery generations={mockGenerations} />);

    await user.click(screen.getByTestId("generation-card-Luma"));
    expect(screen.getByTestId("video-player")).toBeInTheDocument();

    await user.click(screen.getByText("Close"));
    expect(screen.queryByTestId("video-player")).not.toBeInTheDocument();
  });
});
