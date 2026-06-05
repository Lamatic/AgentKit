function decodeContent(raw, status) {
  if (!raw || status === "404") return null;
  try {
    return Buffer.from(raw.replace(/\n/g, ""), "base64").toString("utf-8").slice(0, 1500);
  } catch {
    return null;
  }
}

const readmeRaw = {{apiNode_202.output.content}} || "";
const readmeStatus = String({{apiNode_202.output.status}} || "");
const readme = (readmeRaw && readmeStatus !== "404")
  ? Buffer.from(readmeRaw.replace(/\n/g, ""), "base64").toString("utf-8").slice(0, 3000)
  : "No README found.";

const manifests = [];

const pkg = decodeContent(
  {{apiNode_203.output.content}} || "",
  String({{apiNode_203.output.status}} || "")
);
if (pkg) manifests.push(`package.json:\n${pkg}`);

const pyproject = decodeContent(
  {{apiNode_204.output.content}} || "",
  String({{apiNode_204.output.status}} || "")
);
if (pyproject) manifests.push(`pyproject.toml:\n${pyproject}`);

const gomod = decodeContent(
  {{apiNode_205.output.content}} || "",
  String({{apiNode_205.output.status}} || "")
);
if (gomod) manifests.push(`go.mod:\n${gomod}`);

const manifestContent = manifests.length > 0
  ? manifests.join("\n\n")
  : "No dependency manifest found.";

const allFiles = ({{apiNode_201.output.tree}} || []).map(f => f.path);
const filtered = allFiles.filter(p => {
  const depth = p.split("/").length;
  return depth <= 3
    && !p.startsWith("node_modules")
    && !p.startsWith(".git")
    && !p.startsWith("dist")
    && !p.startsWith("build")
    && !p.includes(".env");
}).slice(0, 80);

output = { fileTree: filtered.join("\n"), readme, manifestContent };
