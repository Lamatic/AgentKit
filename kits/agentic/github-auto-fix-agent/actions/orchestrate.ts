"use server";

import { lamaticClient } from "@/lib/lamatic-client";

export async function handleFixIssue(input: {
  issue_url: string;
  file_path?: string;
  file_content?: string;
}) {
  try {
    console.log("[agent] Input:", input);

    const flowId = process.env.GITHUB_AUTO_FIX;
    console.log("FLOW ID:", flowId);
    if (!flowId) throw new Error("Missing flow ID");

    // 🔥 Step 1: Run Lamatic Flow
    const resData = await lamaticClient.executeFlow(flowId, input);

    if (resData.status !== "success" || !resData.result) {
      throw new Error(resData.message || "Lamatic flow failed");
    }

    const result = resData.result;

    const { analysis, fix, pr } = result;

    console.log("[agent] Flow output:", result);

    // 🔥 Step 2: Extract repo info
    const match = input.issue_url.match(
      /github.com\/(.*?)\/(.*?)\/issues\/(\d+)/,
    );
    if (!match) throw new Error("Invalid GitHub issue URL");

    const [, owner, repo] = match;

    // 🔥 Step 3: Get repo default branch
    const repoData = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      },
    ).then((res) => res.json());

    const baseBranch = repoData.default_branch;

    // 🔥 Step 4: Get latest commit SHA
    const refData = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      },
    ).then((res) => res.json());

    const baseSha = refData.object.sha;

    // 🔥 Step 5: Create branch
    await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: `refs/heads/${pr.branch_name}`,
        sha: baseSha,
      }),
    });

    // 🔥 Step 6: Get file SHA
    if (!input.file_path) {
      throw new Error("file_path is required for PR creation");
    }

    const fileData = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${input.file_path}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      },
    ).then((res) => res.json());

    const fileSha = fileData.sha;

    // 🔥 Step 7: Update file
    await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${input.file_path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: pr.commit_message,
          content: Buffer.from(fix.updated_code).toString("base64"),
          branch: pr.branch_name,
          sha: fileSha,
        }),
      },
    );

    // 🔥 Step 8: Create PR
    const prRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: pr.pr_title,
          head: pr.branch_name,
          base: baseBranch,
          body: pr.pr_body,
        }),
      },
    );

    const prData = await prRes.json();

    return {
      success: true,
      pr_url: prData.html_url,
      analysis,
      fix,
    };
  } catch (error) {
    console.error("[agent] Error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
