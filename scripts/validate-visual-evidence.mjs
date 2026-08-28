import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import parityManifest from "../scraps-parity.json" with { type: "json" };
import visualReview from "../tests/visual/visual-review.json" with { type: "json" };
import { assertPinnedSentryCheckout } from "./sentry-review-server.mjs";
import {
  pairedScenarios,
  scenarioContractHash,
  visualScenarioContract,
  visualViews,
} from "./visual-scenario-contract.mjs";

const projectDirectory = path.resolve(import.meta.dirname, "..");
const canonicalMetadataPath = path.join(
  projectDirectory,
  "tests/visual/canonical-capture-metadata.json",
);
const localMetadataPath = path.join(projectDirectory, "tests/visual/local-capture-metadata.json");
const canonicalDirectory = path.join(projectDirectory, "tests/visual/canonical-screenshots");
const localDirectory = path.join(projectDirectory, "tests/visual/paired-screenshots");

function sha256(fileName) {
  return createHash("sha256").update(readFileSync(fileName)).digest("hex");
}

function pngDimensions(contents) {
  if (contents.toString("ascii", 1, 4) !== "PNG") throw new Error("not a PNG");
  return { height: contents.readUInt32BE(20), width: contents.readUInt32BE(16) };
}

export function computeScenarioEvidenceHash({ canonicalRecords, localRecords, scenarioId }) {
  return createHash("sha256")
    .update(
      JSON.stringify(
        visualViews.map((view) => ({
          canonical: canonicalRecords.find(
            (record) => record.scenario === scenarioId && record.view === view,
          )?.sha256,
          local: localRecords.find(
            (record) => record.scenario === scenarioId && record.view === view,
          )?.sha256,
          view,
        })),
      ),
    )
    .digest("hex");
}

export function validateVisualEvidence({
  repository = path.resolve(projectDirectory, "../sentry-scraps-latest"),
  runCommand = execFileSync,
  exists = existsSync,
  readFile = readFileSync,
  requireApproval = true,
} = {}) {
  assertPinnedSentryCheckout({ repository, commit: parityManifest.canonical.commit, runCommand });
  const componentNames = new Set(
    parityManifest.modules.map(({ local }) =>
      new URL(local.playgroundPath, "https://scrapscn.localhost").searchParams.get("component"),
    ),
  );
  const contractNames = Object.keys(visualScenarioContract);
  const missingContract = [...componentNames].filter(
    (component) => !contractNames.includes(component),
  );
  const extraContract = contractNames.filter((component) => !componentNames.has(component));
  const scenarios = pairedScenarios();
  const storySlugs = new Set(
    runCommand(
      "git",
      [
        "-C",
        repository,
        "ls-tree",
        "-r",
        "--name-only",
        parityManifest.canonical.commit,
        "static/app/components/core",
      ],
      { encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter((fileName) => fileName.endsWith(".mdx"))
      .map((fileName) => path.basename(fileName, ".mdx").toLocaleLowerCase()),
  );
  const demoStorySlugs = new Set(
    runCommand(
      "git",
      [
        "-C",
        repository,
        "grep",
        "-l",
        "-E",
        "<(Storybook\\.)?Demo",
        parityManifest.canonical.commit,
        "--",
        "static/app/components/core/**/*.mdx",
      ],
      { encoding: "utf8" },
    )
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((line) => path.basename(line.split(":").at(-1), ".mdx").toLocaleLowerCase()),
  );
  const declaredScenarios = Object.values(visualScenarioContract).flatMap(
    ({ scenarios: familyScenarios }) => familyScenarios,
  );
  const invalidStories = declaredScenarios
    .filter(({ target }) => !storySlugs.has(target.slug))
    .map(({ id }) => id);
  const missingDemoStories = scenarios
    .filter(({ target }) => !demoStorySlugs.has(target.slug))
    .map(({ id }) => id);
  const missingLedger = [...componentNames].filter(
    (component) => !(component in visualReview.entries),
  );
  const extraLedger = Object.keys(visualReview.entries).filter(
    (component) => !componentNames.has(component),
  );
  const excluded = Object.values(visualScenarioContract).flatMap(
    ({ exclusions, scenarios: familyScenarios }) => [
      ...exclusions,
      ...familyScenarios.filter(({ exclusion }) => exclusion),
    ],
  );
  if (
    missingContract.length ||
    extraContract.length ||
    invalidStories.length ||
    missingDemoStories.length ||
    missingLedger.length ||
    extraLedger.length ||
    !excluded.every(({ reason, exclusion }) => reason || exclusion?.reason)
  ) {
    throw new Error(
      `Visual scenario contract is incomplete. Missing: ${missingContract.join(", ") || "none"}. Extra: ${extraContract.join(", ") || "none"}. Invalid stories: ${invalidStories.join(", ") || "none"}. Stories without demos: ${missingDemoStories.join(", ") || "none"}. Missing ledger: ${missingLedger.join(", ") || "none"}. Extra ledger: ${extraLedger.join(", ") || "none"}.`,
    );
  }
  if (!exists(canonicalMetadataPath) || !exists(localMetadataPath)) {
    throw new Error(
      "Visual paired evidence metadata is missing. Run both paired capture commands against the pinned server before review.",
    );
  }
  const canonicalEvidence = JSON.parse(readFile(canonicalMetadataPath, "utf8"));
  const localEvidence = JSON.parse(readFile(localMetadataPath, "utf8"));
  const contractHash = scenarioContractHash();
  if (
    canonicalEvidence.contractHash !== contractHash ||
    localEvidence.contractHash !== contractHash ||
    canonicalEvidence.canonicalCommit !== parityManifest.canonical.commit ||
    localEvidence.canonicalCommit !== parityManifest.canonical.commit
  ) {
    throw new Error(
      "Visual paired evidence does not match the current scenario contract or canonical commit.",
    );
  }
  const expected = new Set(
    scenarios.flatMap(({ id }) => visualViews.map((view) => `${id}-${view}`)),
  );
  const canonicalRecords = canonicalEvidence.records ?? [];
  const localRecords = localEvidence.records ?? [];
  const canonicalFound = new Set(
    canonicalRecords.map(({ scenario, view }) => `${scenario}-${view}`),
  );
  const localFound = new Set(localRecords.map(({ scenario, view }) => `${scenario}-${view}`));
  if (
    expected.size !== canonicalFound.size ||
    expected.size !== localFound.size ||
    [...expected].some((key) => !canonicalFound.has(key) || !localFound.has(key))
  ) {
    throw new Error("Visual paired evidence does not cover every required scenario and view.");
  }
  for (const canonical of canonicalRecords) {
    const local = localRecords.find(
      ({ scenario, view }) => scenario === canonical.scenario && view === canonical.view,
    );
    const scenario = scenarios.find(({ id }) => id === canonical.scenario);
    if (
      !scenario ||
      !local ||
      !visualViews.includes(canonical.view) ||
      [canonical, local].some(
        (record) =>
          record.locale !== "en-US" ||
          record.reducedMotion !== "reduce" ||
          !record.fontsReady ||
          record.theme !== record.view.split("-")[0],
      )
    ) {
      throw new Error(
        `Invalid visual evidence metadata for ${canonical.scenario}:${canonical.view}.`,
      );
    }
    const localFile = path.join(localDirectory, local.image);
    const canonicalFile = path.join(canonicalDirectory, canonical.image);
    if (!exists(localFile) || !exists(canonicalFile))
      throw new Error(`Missing paired image for ${canonical.scenario}:${canonical.view}.`);
    if (sha256(localFile) !== local.sha256 || sha256(canonicalFile) !== canonical.sha256) {
      throw new Error(`Paired image hash changed for ${canonical.scenario}:${canonical.view}.`);
    }
    const localDimensions = pngDimensions(readFile(localFile));
    const canonicalDimensions = pngDimensions(readFile(canonicalFile));
    if (
      JSON.stringify(localDimensions) !== JSON.stringify(canonicalDimensions) ||
      JSON.stringify(localDimensions) !== JSON.stringify(canonical.dimensions) ||
      JSON.stringify(localDimensions) !== JSON.stringify(local.dimensions)
    ) {
      throw new Error(
        `Paired image dimensions differ for ${canonical.scenario}:${canonical.view}.`,
      );
    }
  }
  if (requireApproval) {
    const scenarioReviews = visualReview.scenarios ?? {};
    const expectedReviewIds = new Set(scenarios.map(({ id }) => id));
    const extraReviewIds = Object.keys(scenarioReviews).filter(
      (scenarioId) => !expectedReviewIds.has(scenarioId),
    );
    if (Object.keys(scenarioReviews).length !== scenarios.length || extraReviewIds.length) {
      throw new Error(
        `Visual scenario approvals are incomplete. Extra: ${extraReviewIds.join(", ") || "none"}.`,
      );
    }
    for (const scenario of scenarios) {
      const review = scenarioReviews[scenario.id];
      if (!review || ["blocking", "unreviewed"].includes(review.status)) {
        throw new Error(`Visual review is not approved for ${scenario.id}.`);
      }
      const evidenceHash = computeScenarioEvidenceHash({
        canonicalRecords,
        localRecords,
        scenarioId: scenario.id,
      });
      if (review.evidenceHash !== evidenceHash) {
        throw new Error(`Visual approval hashes are missing or stale for ${scenario.id}.`);
      }
    }
  }
  return { contractHash, records: canonicalRecords.length };
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const result = validateVisualEvidence();
  process.stdout.write(
    `Validated ${result.records} paired visual records (${result.contractHash}).\n`,
  );
}
