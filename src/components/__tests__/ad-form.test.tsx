import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, userEvent } from "@/test/test-utils";
import { AdForm } from "../ad-form";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("../upload-zone", () => ({
  UploadZone: ({ onUploadComplete }: { onUploadComplete: (urls: string[]) => void }) => (
    <button data-testid="mock-upload" onClick={() => onUploadComplete(["https://utfs.io/f/test.jpg"])}>
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
    expect(screen.getByPlaceholderText(/cozy Italian/)).toBeInTheDocument();
    expect(screen.getByText("10s")).toBeInTheDocument();
    expect(screen.getByText("15s")).toBeInTheDocument();
    expect(screen.getByText("30s")).toBeInTheDocument();
    expect(screen.getByText("Generate Ad")).toBeInTheDocument();
  });

  it("disables submit button when prompt is too short", () => {
    render(<AdForm />);
    expect(screen.getByText("Generate Ad").closest("button")).toBeDisabled();
  });

  it("enables submit button with valid prompt", async () => {
    const user = userEvent.setup();
    render(<AdForm />);
    await user.type(screen.getByPlaceholderText(/cozy Italian/), "A beautiful bakery in downtown Portland");
    expect(screen.getByText("Generate Ad").closest("button")).toBeEnabled();
  });

  it("shows character count", async () => {
    const user = userEvent.setup();
    render(<AdForm />);
    await user.type(screen.getByPlaceholderText(/cozy Italian/), "Hello world");
    expect(screen.getByText("11/2000")).toBeInTheDocument();
  });

  it("submits form and redirects to job page", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobId: "job-abc" }),
    });

    render(<AdForm />);
    await user.type(screen.getByPlaceholderText(/cozy Italian/), "A cozy bakery with fresh bread and pastries");
    await user.click(screen.getByText("Generate Ad"));

    expect(global.fetch).toHaveBeenCalledWith("/api/jobs", expect.objectContaining({ method: "POST" }));
    expect(mockPush).toHaveBeenCalledWith("/jobs/job-abc");
  });

  it("shows error on API failure", async () => {
    const user = userEvent.setup();
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    render(<AdForm />);
    await user.type(screen.getByPlaceholderText(/cozy Italian/), "A valid prompt for testing purposes");
    await user.click(screen.getByText("Generate Ad"));

    expect(await screen.findByText("Server error")).toBeInTheDocument();
  });
});
