import crypto from "crypto";
import { NextResponse } from "next/server";
import { getLamaticClient, getFlowIds } from "@/lib/lamatic-client";
import { fetchCommitDetail, buildCommitText } from "@/lib/github";

/** Verifies GitHub's X-Hub-Signature-256 HMAC against the raw request bytes. */
function verifySignature(rawBody: Buffer, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

/** Handles GitHub push webhooks: verifies signature, fetches diffs, and logs a diary entry. */
export async function POST(req: Request) {
  const rawBytes = Buffer.from(await req.arrayBuffer());
  const rawBody = rawBytes.toString("utf8");

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (secret) {
    const signature = req.headers.get("x-hub-signature-256");
    if (!verifySignature(rawBytes, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const event = req.headers.get("x-github-event");
  if (event === "ping") {
    return NextResponse.json({ ok: true, message: "DevDiary webhook is alive" });
  }
  if (event !== "push") {
    return NextResponse.json({ ok: true, skipped: `Ignored event: ${event}` });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const commits: any[] = payload.commits ?? [];
  if (commits.length === 0) {
    return NextResponse.json({ ok: true, skipped: "Push had no commits" });
  }

  const [owner, repo] = String(payload.repository?.full_name ?? "").split("/");
  if (!owner || !repo) {
    return NextResponse.json({ error: "Missing repository info" }, { status: 400 });
  }
  const branch = String(payload.ref ?? "").replace("refs/heads/", "");
  const author = payload.pusher?.name ?? "unknown";

  try {
    const details = await Promise.all(
      commits.slice(0, 10).map((c) => fetchCommitDetail(owner, repo, c.id))
    );
    const commitText = buildCommitText(details);

    const client = getLamaticClient();
    const response = await client.executeFlow(getFlowIds().log, {
      project: repo,
      repo: `${owner}/${repo}`,
      branch,
      author,
      date: new Date().toISOString(),
      commitText,
    });

    return NextResponse.json({
      ok: true,
      logged: details.length,
      entry: response?.result?.entry ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
