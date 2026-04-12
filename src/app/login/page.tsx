import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Left hero panel */}
      <div className="brand-gradient" style={{
        width: "50%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "64px",
        color: "white",
      }}>
        <h1 style={{ fontSize: "48px", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          Create stunning<br />video ads with AI
        </h1>
        <p style={{ marginTop: "24px", fontSize: "18px", opacity: 0.8, maxWidth: "440px", lineHeight: 1.6 }}>
          5 AI providers generate your ad in parallel. Compare results side by side and pick the best one for your business.
        </p>
        <div style={{ marginTop: "48px", display: "flex", gap: "48px", fontSize: "14px", opacity: 0.6 }}>
          <div>
            <div style={{ fontSize: "32px", fontWeight: 700, opacity: 1 }}>5</div>
            <div>AI Providers</div>
          </div>
          <div>
            <div style={{ fontSize: "32px", fontWeight: 700, opacity: 1 }}>30s</div>
            <div>Max Duration</div>
          </div>
          <div>
            <div style={{ fontSize: "32px", fontWeight: 700, opacity: 1 }}>~3min</div>
            <div>Generation</div>
          </div>
        </div>
      </div>

      {/* Right sign-in panel */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        backgroundColor: "var(--color-surface)",
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
              <div className="brand-gradient" style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                </svg>
              </div>
              <span style={{ fontSize: "24px", fontWeight: 700, color: "var(--color-text-primary)" }}>AdForge</span>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 600, color: "var(--color-text-primary)" }}>Welcome back</h2>
            <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--color-text-secondary)" }}>
              Sign in to create AI-powered video ads
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              style={{
                width: "100%",
                height: "48px",
                borderRadius: "12px",
                border: "1px solid var(--color-border-light)",
                backgroundColor: "var(--color-surface-raised)",
                color: "var(--color-text-primary)",
                fontSize: "15px",
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                transition: "all 0.15s",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>

          <p style={{ textAlign: "center", fontSize: "12px", color: "var(--color-text-muted)", marginTop: "24px" }}>
            By continuing, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
