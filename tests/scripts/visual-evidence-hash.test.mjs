import assert from "node:assert/strict";
import test from "node:test";

import { computeScenarioEvidenceHash } from "../../scripts/validate-visual-evidence.mjs";
import { visualScenarioContract, visualViews } from "../../scripts/visual-scenario-contract.mjs";

const scenarioId = "checkbox--checkbox";

function records(prefix) {
  return visualViews.map((view) => ({
    scenario: scenarioId,
    sha256: `${prefix}-${view}`,
    view,
  }));
}

test("binds a visual approval to every local and canonical image", () => {
  const canonicalRecords = records("canonical");
  const localRecords = records("local");
  const approvedHash = computeScenarioEvidenceHash({
    canonicalRecords,
    localRecords,
    scenarioId,
  });

  for (const side of ["canonical", "local"]) {
    const changedCanonical = structuredClone(canonicalRecords);
    const changedLocal = structuredClone(localRecords);
    const changedRecords = side === "canonical" ? changedCanonical : changedLocal;
    changedRecords[2].sha256 = `${side}-changed`;

    assert.notEqual(
      computeScenarioEvidenceHash({
        canonicalRecords: changedCanonical,
        localRecords: changedLocal,
        scenarioId,
      }),
      approvedHash,
    );
  }
});

test("isolates a canonical demo instead of the full catalog page", () => {
  for (const family of Object.values(visualScenarioContract)) {
    for (const scenario of family.scenarios) {
      assert.equal(scenario.canonical.selector, '[data-test-id="storybook-demo"]');
    }
  }
  assert.equal(
    visualScenarioContract.layout.scenarios.find((scenario) => !scenario.exclusion)?.target.slug,
    "container",
  );
});
