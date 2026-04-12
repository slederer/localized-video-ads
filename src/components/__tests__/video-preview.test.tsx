import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VideoPreview } from "../video-preview";

describe("VideoPreview", () => {
  it("renders video player with controls", () => {
    render(
      <VideoPreview
        videoUrl="https://r2.dev/video.mp4"
        provider="Luma"
        onClose={vi.fn()}
      />
    );

    const video = screen.getByTestId("video-player") as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video.src).toContain("video.mp4");
    expect(video.controls).toBe(true);
  });

  it("shows provider name as badge", () => {
    render(
      <VideoPreview
        videoUrl="https://r2.dev/video.mp4"
        provider="Runway"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText("Runway")).toBeInTheDocument();
  });

  it("has download link with correct URL", () => {
    render(
      <VideoPreview
        videoUrl="https://r2.dev/video.mp4"
        provider="Luma"
        onClose={vi.fn()}
      />
    );

    const link = screen.getByText("Download Video").closest("a");
    expect(link?.href).toContain("video.mp4");
    expect(link?.getAttribute("download")).toBeDefined();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <VideoPreview
        videoUrl="https://r2.dev/video.mp4"
        provider="Luma"
        onClose={onClose}
      />
    );

    await user.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});
