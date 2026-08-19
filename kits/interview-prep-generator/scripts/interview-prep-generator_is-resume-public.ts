// Code: Is Resume Public
// Flow: interview-prep-generator
//
// A real PDF response starts with the magic bytes "%PDF-". Google's
// sign-in / permission-denied interstitial pages come back as HTML
// instead, so this checks for either signal to decide whether the Drive
// link is actually publicly accessible.

const raw = `{{apiNode_649.output}}`;
const bodyText = typeof raw === 'string' ? raw : JSON.stringify(raw);

const looksLikePdf = bodyText.startsWith('%PDF') || bodyText.includes('%PDF-');
const looksLikeGoogleErrorPage =
    !looksLikePdf && (
          /accounts\.google\.com\/(ServiceLogin|signin)/i.test(bodyText) ||
          /(sign in|request access|you need permission)/i.test(bodyText) ||
          /<!DOCTYPE html/i.test(bodyText)
        );

const isPublic = looksLikePdf && !looksLikeGoogleErrorPage;

output = {
    isPublic,
    reason: isPublic
      ? 'response looks like a PDF'
          : looksLikeGoogleErrorPage
        ? "Drive returned a sign-in/permission page - link isn't public"
            : 'response did not look like a PDF'
};
