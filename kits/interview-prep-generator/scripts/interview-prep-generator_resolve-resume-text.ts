// Code: Resolve Resume Text
// Flow: interview-prep-generator
//
// Extract from File returns files: [{ metadata, data: [...] }], one entry
// per input URL, with joinPages:true collapsing a multi-page PDF into one
// string per file. This pulls files[0].data into a single joined string -
// the single source of truth for "the resume text" downstream.

const filesRaw = `{{extractFromFileNode_510.output.files}}`;

let resumeText = '';
try {
    const files = typeof filesRaw === 'string' ? JSON.parse(filesRaw) : filesRaw;
    if (Array.isArray(files) && files.length > 0 && Array.isArray(files[0].data)) {
          resumeText = files[0].data.filter(Boolean).join('\n\n');
    }
} catch (e) {
    resumeText = '';
}

output = { resumeText };
