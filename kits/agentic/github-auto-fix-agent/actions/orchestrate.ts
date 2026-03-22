"use server";

import { lamaticClient } from "@/lib/lamatic-client";

/**
 * Step 1: Analyze the issue and generate a fix (NO PR creation).
 * Returns analysis, fix data, and PR metadata from the Lamatic flow.
 */
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

    // Run Lamatic Flow
    const resData = await lamaticClient.executeFlow(flowId, input);

    if (resData.status !== "success" || !resData.result) {
      throw new Error(resData.message || "Lamatic flow failed");
    }

    const result = resData.result;
    const { analysis, fix, pr } = result;

    console.log("[agent] Flow output:", result);

    return {
      success: true,
      analysis,
      fix,
      pr, // branch_name, commit_message, pr_title, pr_body
    };
  } catch (error) {
    console.error("[agent] Error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Step 2: Create a GitHub PR using the fix data from Step 1.
 * This is called separately only when the user clicks "Create PR".
 */
export async function handleCreatePR(input: {
  issue_url: string;
  file_path: string;
  fix: { updated_code: string };
  pr: {
    branch_name: string;
    commit_message: string;
    pr_title: string;
    pr_body: string;
  };
}) {
  try {
    const { issue_url, file_path, fix, pr } = input;

    // Extract repo info
    const match = issue_url.match(
      /github.com\/(.*?)\/(.*?)\/issues\/(\d+)/,
    );
    if (!match) throw new Error("Invalid GitHub issue URL");

    const [, owner, repo] = match;

    // Get repo default branch
    const repoData = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      },
    ).then((res) => res.json());

    const baseBranch = repoData.default_branch;

    // Get latest commit SHA
    const refData = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${baseBranch}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      },
    ).then((res) => res.json());

    const baseSha = refData.object.sha;

    // Create branch
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

    // Get file SHA
    const fileData = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${file_path}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        },
      },
    ).then((res) => res.json());

    const fileSha = fileData.sha;

    // Update file on branch
    await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${file_path}`,
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

    // Create PR
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
    };
  } catch (error) {
    console.error("[agent] PR creation error:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
