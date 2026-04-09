// Assign the value you want to return from this code node to `output`. 
// The `output` variable is already declared.
const fileBase64 = {{triggerNode_1.output.file_base64}};
const fileUrl    = {{triggerNode_1.output.file_url}};
const fileName   = {{triggerNode_1.output.file_name}} || "document.pdf";
const mimeType   = {{triggerNode_1.output.mime_type}} || "application/pdf";

// If a URL was provided directly, use it — no storage upload needed
if (!fileBase64 && fileUrl) {
  output = { resolved_url: fileUrl, file_name: fileName, uploaded_to_storage: false };
  return output;
}

if (!fileBase64) {
  throw new Error("No file_base64 or file_url provided");
}

// Upload base64 to Supabase Storage
const supabaseUrl = {{secrets.project.SUPABASE_URL}};   // from Lamatic secret
const serviceKey  = {{secrets.project.SUPABASE_SERVICE_ROLE_KEY}};    // from Lamatic secret

// Convert base64 to binary
// base64 may arrive as a plain string or as data:mime;base64,... URI
let b64 = fileBase64;
if (b64.includes(",")) b64 = b64.split(",")[1];

const binaryStr = atob(b64);
const bytes     = new Uint8Array(binaryStr.length);
for (let i = 0; i < binaryStr.length; i++) {
  bytes[i] = binaryStr.charCodeAt(i);
}

// Unique storage path
const safeName    = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
const storagePath = `${Date.now()}_${safeName}`;

const uploadResp = await fetch(
  `${supabaseUrl}/storage/v1/object/pdfs/${storagePath}`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": mimeType,
      "x-upsert": "false",
    },
    body: bytes,
  }
);

if (!uploadResp.ok) {
  const errText = await uploadResp.text();
  throw new Error(`Storage upload failed: ${uploadResp.status} — ${errText}`);
}

const signResp = await fetch(
  `${supabaseUrl}/storage/v1/object/sign/pdfs/${storagePath}`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${serviceKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ expiresIn: 3600 }) // Valid for 1 hour
  }
);
if (!signResp.ok) {
  throw new Error(`Signed URL failed: ${signResp.status}`);
}
const signData = await signResp.json();
const signedUrl = `${supabaseUrl}/storage/v1${signData.signedURL}`;
console.log("Processing complete");

output = {
  resolved_url: signedUrl,
  file_name: fileName,
  uploaded_to_storage: true,
};

console.log("✅ Code node complete:", output.resolved_url);