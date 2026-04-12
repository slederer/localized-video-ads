import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdForm } from "../ad-form";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock UploadZone to avoid UploadThing dependency
vi.mock("../upload-zone", () => ({
  UploadZone: ({ onUploadComplete }: { onUploadComplete: (urls: string[]) => void }) => (
    <button
      data-testid="mock-upload"
      onClick={() => onUploadComplete(["https://utfs.io/f/test.jpg"])}
    >
      Upload
    </button>
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

describe("AdForm", () => {
  it("renders the form with all fields", () => {
    render(<AdForm />);

    expect(screen.getByText("Create Your Video Ad")).toBeInTheDocument();
    expect(screen.getByLabelText("Ad Description")).toBeInTheDocument();
    expect(screen.getByText("10s")).toBeInTheDocument();
    expect(screen.getByText("15s")).toBeInTheDocument();
    expect(screen.getByText("30s")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate Ad" })
    ).toBeInTheDocument();
  });

  it("disables submit button when prompt is too short", () => {
    render(<AdForm />);
    const button = screen.getByRole("button", { name: "Generate Ad" });
    expect(button).toBeDisabled();
  });

  it("enables submit button with valid prompt", async () => {
    const user = userEvent.setup();
    render(<AdForm />);

    await user.type(
      screen.getByLabelText("Ad Description"),
      "A beautiful bakery in downtown Portland"
    );

    const button = screen.getByRole("button", { name: "Generate Ad" });
    expect(button).toBeEnabled();
  });

  it("shows character count", async () => {
    const user = userEvent.setup();
    render(<AdForm />);

    await user.type(screen.getByLabelText("Ad Description"), "Hello world");

    expect(screen.getByText("11/2000 characters")).toBeInTheDocument();
  });

  it("submits form and redirects to job page", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobId: "job-abc" }),
    });

    render(<AdForm />);

    await user.type(
      screen.getByLabelText("Ad Description"),
      "A cozy bakery with fresh bread and pastries"
    );
    await user.click(screen.getByRole("button", { name: "Generate Ad" }));

    expect(global.fetch).toHaveBeenCalledWith("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.stringContaining("A cozy bakery"),
    });

    expect(mockPush).toHaveBeenCalledWith("/jobs/job-abc");
  });

  it("shows error on API failure", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    render(<AdForm />);

    await user.type(
      screen.getByLabelText("Ad Description"),
      "A valid prompt for testing purposes"
    );
    await user.click(screen.getByRole("button", { name: "Generate Ad" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Server error");
  });

  it("shows Creating... while submitting", async () => {
    const user = userEvent.setup();
    let resolvePromise: (value: unknown) => void;
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((r) => {
        resolvePromise = r;
      })
    );

    render(<AdForm />);

    await user.type(
      screen.getByLabelText("Ad Description"),
      "A valid test prompt for a bakery"
    );
    await user.click(screen.getByRole("button", { name: "Generate Ad" }));

    expect(screen.getByText("Creating...")).toBeInTheDocument();

    // Resolve to clean up
    resolvePromise!({
      ok: true,
      json: () => Promise.resolve({ jobId: "job-1" }),
    });
  });
});
