import { describe, it, expect, vi } from "vitest";
import { render, screen, userEvent } from "@/test/test-utils";
import { DurationSelector } from "../duration-selector";

describe("DurationSelector", () => {
  it("renders all three duration options", () => {
    render(<DurationSelector value={10} onChange={vi.fn()} />);
    expect(screen.getByText("10s")).toBeInTheDocument();
    expect(screen.getByText("15s")).toBeInTheDocument();
    expect(screen.getByText("30s")).toBeInTheDocument();
  });

  it("shows descriptions for each duration", () => {
    render(<DurationSelector value={10} onChange={vi.fn()} />);
    expect(screen.getByText("Quick teaser")).toBeInTheDocument();
    expect(screen.getByText("Social media")).toBeInTheDocument();
    expect(screen.getByText("Full ad spot")).toBeInTheDocument();
  });

  it("calls onChange when a duration is clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DurationSelector value={10} onChange={onChange} />);
    await user.click(screen.getByText("30s"));
    expect(onChange).toHaveBeenCalledWith(30);
  });
});
