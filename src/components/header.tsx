import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function Header() {
  const session = await auth();

  return (
    <header style={{
      position: "sticky",
      top: 0,
      zIndex: 50,
      borderBottom: "1px solid var(--color-border-light)",
      backgroundColor: "rgba(255,255,255,0.85)",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        height: "60px",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
          <div className="brand-gradient" style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
            </svg>
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-primary)" }}>AdForge</span>
        </Link>
        {session?.user && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                style={{ width: "28px", height: "28px", borderRadius: "50%" }}
              />
            )}
            <span style={{ fontSize: "14px", color: "var(--color-text-secondary)" }}>
              {session.user.name || session.user.email}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                style={{
                  border: "none",
                  background: "none",
                  color: "var(--color-text-muted)",
                  fontSize: "13px",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: "6px",
                }}
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
