import { mkdir, readFile, writeFile } from "node:fs/promises";

import visualReview from "../tests/visual/visual-review.json" with { type: "json" };
import { validateVisualEvidence } from "./validate-visual-evidence.mjs";
import { createSentryStoryUrl, parseSentryReviewOrigin } from "./visual-review-inputs.mjs";
import { pairedScenarios, visualViews } from "./visual-scenario-contract.mjs";

validateVisualEvidence({ requireApproval: false });

const localMetadata = JSON.parse(
  await readFile(new URL("../tests/visual/local-capture-metadata.json", import.meta.url), "utf8"),
);
const canonicalMetadata = JSON.parse(
  await readFile(
    new URL("../tests/visual/canonical-capture-metadata.json", import.meta.url),
    "utf8",
  ),
);
const outputDirectory = new URL("../test-results/visual-review/", import.meta.url);
const outputFile = new URL("index.html", outputDirectory);
const origin = parseSentryReviewOrigin(
  process.env.SENTRY_REVIEW_ORIGIN ?? "https://sentry.dev.getsentry.net:8000",
);
const organization = process.env.SENTRY_ORG_SLUG ?? "sentry";

function escapeHtml(value) {
  return String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character],
  );
}

function imageFor(records, scenario, view) {
  return records.find((record) => record.scenario === scenario.id && record.view === view).image;
}

const cards = pairedScenarios()
  .map((scenario) => {
    const review = visualReview.scenarios?.[scenario.id] ?? {
      note: "Review this matched scenario and bind its evidence hash before completion.",
      status: "unreviewed",
    };
    const targetUrl = createSentryStoryUrl({ origin, organization, slug: scenario.target.slug });
    const views = visualViews
      .map((view) => {
        const local = `../../tests/visual/paired-screenshots/${imageFor(localMetadata.records, scenario, view)}`;
        const canonical = `../../tests/visual/canonical-screenshots/${imageFor(canonicalMetadata.records, scenario, view)}`;
        return `<figure><figcaption>${escapeHtml(view)}</figcaption><div class="raw"><div><strong>Scrapscn</strong><img alt="Scrapscn ${escapeHtml(scenario.id)} ${escapeHtml(view)}" src="${escapeHtml(local)}"></div><div><strong>Canonical</strong><img alt="Canonical Scraps ${escapeHtml(scenario.id)} ${escapeHtml(view)}" src="${escapeHtml(canonical)}"></div></div><strong>50% overlay</strong><div class="comparison"><img alt="Scrapscn overlay base ${escapeHtml(scenario.id)} ${escapeHtml(view)}" src="${escapeHtml(local)}"><img class="overlay" alt="Canonical overlay ${escapeHtml(scenario.id)} ${escapeHtml(view)}" src="${escapeHtml(canonical)}"></div><strong>Difference blend</strong><div class="difference"><img alt="Scrapscn difference base ${escapeHtml(scenario.id)} ${escapeHtml(view)}" src="${escapeHtml(local)}"><img alt="Canonical difference layer ${escapeHtml(scenario.id)} ${escapeHtml(view)}" src="${escapeHtml(canonical)}"></div></figure>`;
      })
      .join("");
    return `<section class="scenario"><header><h2>${escapeHtml(scenario.component)} · ${escapeHtml(scenario.target.label)}</h2><span>${escapeHtml(review.status)}</span><p>${escapeHtml(review.note)}</p><a href="${escapeHtml(targetUrl)}">Canonical story</a></header><div class="views">${views}</div></section>`;
  })
  .join("");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Scrapscn paired visual review</title><style>
:root{color-scheme:dark;font-family:ui-sans-serif,system-ui;background:#17131e;color:#f5f3f7}*{box-sizing:border-box}body{margin:0;padding:24px}.scenario{margin:0 0 24px;border:1px solid #443c50;border-radius:10px;overflow:hidden}.scenario header{display:flex;gap:12px;align-items:center;padding:12px 16px}.scenario h2,.scenario p{margin:0}.scenario p{color:#b5b0bd;font-size:12px}.scenario a{margin-left:auto;color:#a998ff}.views{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1px;background:#443c50}figure{margin:0;padding:8px;background:#17131e;min-width:0}figcaption,figure>strong,.raw strong{display:block;margin-bottom:8px;color:#b5b0bd;font-size:12px}.raw{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}.raw img,.comparison img,.difference img{display:block;width:100%;height:auto}.comparison,.difference{position:relative;overflow:auto;background:#0d0a11;margin-bottom:12px}.comparison .overlay{position:absolute;inset:0;opacity:.5}.difference{isolation:isolate}.difference img+img{position:absolute;inset:0;mix-blend-mode:difference}@media(max-width:1000px){.views{grid-template-columns:1fr}}@media(max-width:600px){.raw{grid-template-columns:1fr}.scenario header{align-items:flex-start;flex-direction:column}.scenario a{margin-left:0}}
</style></head><body><h1>Scrapscn paired visual review</h1><p>Left image is Scrapscn. The overlay is 50% canonical. The lower view uses difference blend.</p>${cards}</body></html>`;

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputFile, html);
process.stdout.write(`Generated ${outputFile.pathname}\n`);
