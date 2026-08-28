import assert from "node:assert/strict";
import test from "node:test";

import {
  createSentryStoryUrl,
  parseSentryReviewOrigin,
} from "../../scripts/visual-review-inputs.mjs";

for (const input of [
  "http://localhost:7999",
  "https://localhost:8001",
  "https://sentry.dev.getsentry.net:8001",
]) {
  test(`accepts the local Sentry review origin ${input}`, () => {
    assert.equal(parseSentryReviewOrigin(input).origin, input);
  });
}

test("encodes the organization and story slug as URL path segments", () => {
  assert.equal(
    createSentryStoryUrl({
      origin: new URL("https://sentry.dev.getsentry.net:8001"),
      organization: `sentry\"><script>alert("unsafe")</script>`,
      slug: "check/box",
    }),
    "https://sentry.dev.getsentry.net:8001/organizations/sentry%22%3E%3Cscript%3Ealert(%22unsafe%22)%3C%2Fscript%3E/scraps/core/check%2Fbox/?theme=light#examples",
  );
});

for (const [organization, slug] of [
  ["", "checkbox"],
  [".", "checkbox"],
  ["..", "checkbox"],
  ["sentry", ""],
  ["sentry", "."],
  ["sentry", ".."],
]) {
  test(`rejects invalid review path segments ${JSON.stringify({ organization, slug })}`, () => {
    assert.throws(
      () =>
        createSentryStoryUrl({
          origin: new URL("https://sentry.dev.getsentry.net:8001"),
          organization,
          slug,
        }),
      /must be a non-empty URL path segment/,
    );
  });
}

for (const input of [
  "https://example.com",
  "https://evil.dev.getsentry.net:8001",
  "https://sentry.dev.getsentry.net.evil.test:8001",
  "https://sentry.dev.getsentry.net:8001/",
  "https://sentry.dev.getsentry.net:8001/path",
  "https://sentry.dev.getsentry.net:8001/foo/..",
  "https://sentry.dev.getsentry.net:8001/?review=true",
  "https://sentry.dev.getsentry.net:8001/#review",
  "https://user:secret@sentry.dev.getsentry.net:8001",
  "file://localhost/tmp/review",
]) {
  test(`rejects the non-local Sentry review origin ${input}`, () => {
    assert.throws(() => parseSentryReviewOrigin(input), /SENTRY_REVIEW_ORIGIN/);
  });
}
