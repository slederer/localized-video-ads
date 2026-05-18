import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Server-rendered overview of all ad creation jobs. No client JS
// (hydration-safe, like /signin) so it works regardless of the
// client-side hydration issue on the Chakra pages.
export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#9ca3af",
  PROCESSING: "#3b82f6",
  GENERATING: "#3b82f6",
  EXTENDING: "#3b82f6",
  UPLOADING: "#8b5cf6",
  COMPLETED: "#22c55e",
  FAILED: "#ef4444",
};

function Pill({ text }: { text: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "999px",
        fontSize: "0.72rem",
        fontWeight: 600,
        color: "#fff",
        background: STATUS_COLOR[text] || "#6b7280",
      }}
    >
      {text}
    </span>
  );
}

export default async function JobsOverviewPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/signin");
  }

  const userId = (session.user as { id?: string }).id;
  const jobs = await db.job.findMany({
    where: userId ? { userId } : undefined,
    include: { generations: { orderBy: { provider: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const totalVideos = jobs.reduce(
    (n, j) => n + j.generations.filter((g) => g.videoUrl).length,
    0
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0b12",
        color: "#fff",
        fontFamily: "system-ui, sans-serif",
        padding: "2.5rem 1.5rem",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "0.5rem",
          }}
        >
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>
            Ad Creation Jobs
          </h1>
          <Link href="/" style={{ color: "#8b5cf6", fontSize: "0.9rem" }}>
            ← New ad
          </Link>
        </div>
        <p style={{ opacity: 0.6, fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          {jobs.length} job{jobs.length === 1 ? "" : "s"} · {totalVideos} video
          {totalVideos === 1 ? "" : "s"} produced
        </p>

        {jobs.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No jobs yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {jobs.map((job) => (
              <div
                key={job.id}
                style={{
                  background: "#15151f",
                  border: "1px solid #26263a",
                  borderRadius: "0.7rem",
                  padding: "1rem 1.25rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "1rem",
                    marginBottom: "0.6rem",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "0.95rem",
                        marginBottom: "0.25rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {job.prompt}
                    </div>
                    <div style={{ fontSize: "0.75rem", opacity: 0.55 }}>
                      {new Date(job.createdAt).toLocaleString()} · {job.duration}s
                      · <Link href={`/jobs/${job.id}`} style={{ color: "#8b5cf6" }}>
                        details
                      </Link>
                    </div>
                  </div>
                  <Pill text={job.status} />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  {job.generations.map((g) => (
                    <span
                      key={g.id}
                      style={{
                        fontSize: "0.75rem",
                        background: "#1d1d2b",
                        border: "1px solid #2d2d44",
                        borderRadius: "0.4rem",
                        padding: "3px 8px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <strong>{g.provider}</strong>
                      <Pill text={g.status} />
                      {g.videoUrl && (
                        <a
                          href={g.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#22c55e" }}
                        >
                          ▶ video
                        </a>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
