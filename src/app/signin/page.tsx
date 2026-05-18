import { signIn } from "@/auth";

// No-JS sign-in fallback. The /login page depends on client-side
// hydration (currently flaky); this page works with a plain HTML form
// POST via a server action — no browser JavaScript required.
export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5rem",
        fontFamily: "system-ui, sans-serif",
        background: "#0b0b12",
        color: "#fff",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>AdForge — Sign in</h1>
      <p style={{ opacity: 0.7, fontSize: "0.9rem" }}>
        No-JavaScript sign-in (works even if the main page is broken).
      </p>
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          style={{
            padding: "0.85rem 1.5rem",
            fontSize: "1rem",
            fontWeight: 600,
            borderRadius: "0.6rem",
            border: "none",
            background: "#6d5dfc",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}
