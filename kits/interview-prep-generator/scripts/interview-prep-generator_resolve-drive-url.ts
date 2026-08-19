// Code: Resolve Drive URL
// Flow: interview-prep-generator
//
// Extracts a Google Drive file ID from whatever format the user pasted and
// builds the direct-download URL. Handles: /file/d/ID/view, ?id=ID, and a
// bare file ID.

const raw = `{{triggerNode_1.output.resume}}`.trim();

const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,   // .../file/d/FILE_ID/view
    /[?&]id=([a-zA-Z0-9_-]+)/,       // .../open?id=FILE_ID or uc?id=FILE_ID
    /^([a-zA-Z0-9_-]{20,})$/         // bare file ID pasted directly
  ];

let fileId = '';
for (const p of patterns) {
    const m = raw.match(p);
    if (m) { fileId = m[1]; break; }
}

output = {
    fileId,
    directUrl: fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : '',
    isValidDriveLink: Boolean(fileId)
};
