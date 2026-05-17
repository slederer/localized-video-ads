import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@/test/test-utils";

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
  // Mirrors Next.js: redirect() throws to halt rendering.
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error("NEXT_REDIRECT");
  },
}));

vi.mock("@/components/home-client", () => ({
  HomeClient: () => <div data-testid="home-client">Home</div>,
}));

import Home from "../page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Home page (server-side auth gate)", () => {
  it("redirects unauthenticated visitors to /login", async () => {
    mockAuth.mockResolvedValue(null);

    await expect(Home()).rejects.toThrow("NEXT_REDIRECT");
    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders the app for authenticated users without redirecting", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", email: "a@b.com" } });

    const ui = await Home();
    render(ui);

    expect(screen.getByTestId("home-client")).toBeInTheDocument();
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
