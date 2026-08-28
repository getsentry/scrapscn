const allowedSentryHosts = new Set(["localhost", "sentry.dev.getsentry.net"]);

export function parseSentryReviewOrigin(input) {
  const origin = new URL(input);
  if (
    input !== origin.origin ||
    !["http:", "https:"].includes(origin.protocol) ||
    !allowedSentryHosts.has(origin.hostname)
  ) {
    throw new Error(
      "SENTRY_REVIEW_ORIGIN must be an http(s) localhost or sentry.dev.getsentry.net origin without a path",
    );
  }
  return origin;
}

export function createSentryStoryUrl({ origin, organization, slug }) {
  for (const [name, value] of [
    ["organization", organization],
    ["story slug", slug],
  ]) {
    if (!value || value === "." || value === "..") {
      throw new Error(`Sentry ${name} must be a non-empty URL path segment`);
    }
  }
  const storyUrl = new URL(
    `/organizations/${encodeURIComponent(organization)}/scraps/core/${encodeURIComponent(slug)}/`,
    origin,
  );
  storyUrl.searchParams.set("theme", "light");
  storyUrl.hash = "examples";
  return storyUrl.href;
}
