// Code: Not Public Error
// Flow: interview-prep-generator
//
// The Drive link the caller supplied wasn't publicly accessible. This
// short-circuits the whole pipeline: the Supervisor/Guardrail/Generate
// branches never run, so this costs nothing beyond the one verification
// request.

output = {
    status: 'error',
    message: "The resume link isn't publicly accessible. In Google Drive: right-click the file -> Share -> General access -> \"Anyone with the link\" -> Viewer, then resubmit.",
    interview_prep: '',
    findings: [],
    usedCompanyResearch: false
};
