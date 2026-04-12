import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test/test-utils";
import { GenerationCard } from "../generation-card";

describe("GenerationCard", () => {
  it("renders provider name and status", () => {
    render(<GenerationCard provider="Luma" status="GENERATING" />);
    expect(screen.getByText("Luma")).toBeInTheDocument();
    expect(screen.getByText("Generating")).toBeInTheDocument();
  });

  it("shows video when completed", () => {
    render(<GenerationCard provider="Runway" status="COMPLETED" videoUrl="https://r2.dev/video.mp4" />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(document.querySelector("video")).toBeInTheDocument();
  });

  it("shows error message when failed", () => {
    render(<GenerationCard provider="Kling" status="FAILED" errorMessage="Rate limit exceeded" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
  });

  it("shows default error when failed without message", () => {
    render(<GenerationCard provider="Veo" status="FAILED" />);
    expect(screen.getByText("Generation failed")).toBeInTheDocument();
  });

  it("shows spinner for in-progress states", () => {
    render(<GenerationCard provider="MiniMax" status="PENDING" />);
    expect(screen.getByText("Queued...")).toBeInTheDocument();
  });

  it("calls onSelect when completed card is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<GenerationCard provider="Luma" status="COMPLETED" videoUrl="https://r2.dev/v.mp4" onSelect={onSelect} />);
    await user.click(screen.getByTestId("generation-card-Luma"));
    expect(onSelect).toHaveBeenCalled();
  });

  it("does not call onSelect when pending", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<GenerationCard provider="Luma" status="PENDING" onSelect={onSelect} />);
    await user.click(screen.getByTestId("generation-card-Luma"));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
