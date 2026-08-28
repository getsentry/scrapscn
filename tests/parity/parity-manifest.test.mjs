import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const validatorPath = path.resolve("scripts/validate-parity-manifest.mjs");
const generatorPath = path.resolve("scripts/generate-parity-manifest.mjs");
const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));

function runParityValidator(manifestPath) {
  return spawnSync(process.execPath, [validatorPath], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, PARITY_MANIFEST_PATH: manifestPath },
  });
}

async function withChangedManifest(change, assertion) {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "scrapscn-parity-"));
  const manifestPath = path.join(temporaryDirectory, "scraps-parity.json");
  const changedManifest = structuredClone(manifest);
  change(changedManifest);
  await writeFile(manifestPath, JSON.stringify(changedManifest));
  try {
    assertion(runParityValidator(manifestPath));
  } finally {
    await rm(temporaryDirectory, { recursive: true });
  }
}

test("accepts the discovered parity inventory", () => {
  const output = execFileSync(process.execPath, [validatorPath], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const moduleCount = manifest.modules.length;
  assert.match(
    output,
    new RegExp(
      `Validated ${moduleCount} discovered modules: ${moduleCount} complete, 0 partial, 0 missing`,
    ),
  );
  assert.match(output, /Canonical exports: \d+ runtime, \d+ type\./);
  assert.doesNotMatch(output, /Canonical source changed:/);
  assert.doesNotMatch(output, /Standalone API work:/);
});

test("classifies every standalone canonical core file", () => {
  assert.deepEqual(manifest.canonical.inventory.unclassifiedDirectories, []);
  assert.deepEqual(manifest.canonical.inventory.unclassifiedStandaloneFiles, []);
  assert.equal(manifest.scope.discoveredModuleCount, manifest.modules.length);
  assert.equal(manifest.canonical.inventory.componentEntryPoints.length, manifest.modules.length);

  const standaloneByPath = new Map(
    manifest.canonical.inventory.standaloneFiles.map((entry) => [entry.path, entry]),
  );
  assert.equal(standaloneByPath.get("datetime.tsx")?.kind, "public-component-api");
  assert.equal(standaloneByPath.get("overlayTrigger.tsx")?.kind, "public-component-api");
  assert.equal(standaloneByPath.get("renderToString.tsx")?.kind, "explicit-exclusion");
});

test("requires coverage for every standalone public API", async () => {
  await withChangedManifest(
    (changedManifest) => {
      changedManifest.scope.standaloneApiCoverage =
        changedManifest.scope.standaloneApiCoverage.filter(
          ({ canonicalPath }) => canonicalPath !== "datetime.tsx",
        );
    },
    (result) => {
      assert.notEqual(result.status, 0);
      assert.match(
        result.stderr,
        /standaloneApiCoverage must match the canonical public API inventory/,
      );
    },
  );
});

test("allows excluded standalone coverage only for explicit exclusions", async () => {
  await withChangedManifest(
    (changedManifest) => {
      changedManifest.scope.standaloneApiCoverage.find(
        ({ canonicalPath }) => canonicalPath === "datetime.tsx",
      ).state = "excluded";
    },
    (result) => {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /datetime\.tsx may not be excluded/);
    },
  );
});

test("rejects a missing standalone runtime export", async () => {
  await withChangedManifest(
    (changedManifest) => {
      changedManifest.scope.standaloneApiCoverage
        .find(({ canonicalPath }) => canonicalPath === "datetime.tsx")
        .canonicalPublicExports.runtime.pop();
    },
    (result) => {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /canonicalPublicExports differs from the pinned contract/);
    },
  );
});

test("rejects a missing standalone type implementation", async () => {
  await withChangedManifest(
    (changedManifest) => {
      changedManifest.scope.standaloneApiCoverage.find(
        ({ canonicalPath }) => canonicalPath === "datetime.tsx",
      ).implementedExports.types = [];
    },
    (result) => {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /implementedExports differs from the local public exports/);
    },
  );
});

test("rejects a broadened standalone exclusion", async () => {
  await withChangedManifest(
    (changedManifest) => {
      const excludedRuntimeExports = changedManifest.scope.standaloneApiCoverage.find(
        ({ canonicalPath }) => canonicalPath === "renderToString.tsx",
      ).excludedExports.runtime;
      excludedRuntimeExports.push("futureExport");
      excludedRuntimeExports.sort();
    },
    (result) => {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /excludedExports must name the exact pinned exports/);
    },
  );
});

test("gives every regular Scraps module a dedicated playground workbench", async () => {
  const registrySource = await readFile("src/components/playground/workbenches/index.tsx", "utf8");
  const workbenchIds = [...registrySource.matchAll(/\bid: "([a-z0-9-]+)"/g)].map(([, id]) => id);
  const playgroundIds = manifest.modules.map(({ local, name }) => {
    assert.match(
      local.playgroundPath,
      /^\/\?component=([a-z0-9-]+)$/,
      `${name} needs a dedicated playground path`,
    );
    return new URL(local.playgroundPath, "https://scrapscn.localhost").searchParams.get(
      "component",
    );
  });

  assert.equal(workbenchIds.length, manifest.modules.length);
  assert.equal(new Set(workbenchIds).size, manifest.modules.length);
  assert.equal(new Set(playgroundIds).size, manifest.modules.length);
  assert.deepEqual(new Set(workbenchIds), new Set(playgroundIds));
});

test("regenerates the checked-in parity manifest without drift", async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "scrapscn-parity-generate-"));
  const generatedPath = path.join(temporaryDirectory, "scraps-parity.json");
  const expected = await readFile("scraps-parity.json", "utf8");
  const env = { ...process.env, PARITY_MANIFEST_OUTPUT: generatedPath };

  try {
    execFileSync(process.execPath, [generatorPath], {
      cwd: process.cwd(),
      env,
    });
    const first = await readFile(generatedPath, "utf8");
    execFileSync(process.execPath, [generatorPath], {
      cwd: process.cwd(),
      env,
    });
    const second = await readFile(generatedPath, "utf8");
    assert.equal(first, expected);
    assert.equal(second, first);
  } finally {
    await rm(temporaryDirectory, { recursive: true });
  }
});

test("reads canonical sources from the pinned commit instead of another dirty checkout", async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "scrapscn-parity-pinned-"));
  const sentryClone = path.join(temporaryDirectory, "sentry");
  const dirtyThemePath = path.join(sentryClone, "static/app/utils/theme/theme.tsx");
  const generatedPath = path.join(temporaryDirectory, "scraps-parity.json");

  try {
    execFileSync("git", [
      "clone",
      "--quiet",
      "--shared",
      "--no-checkout",
      path.resolve("../sentry"),
      sentryClone,
    ]);
    execFileSync("git", [
      "-C",
      sentryClone,
      "checkout",
      "--detach",
      `${manifest.canonical.commit}^`,
    ]);
    await mkdir(path.dirname(dirtyThemePath), { recursive: true });
    await writeFile(dirtyThemePath, 'export const motion = "not canonical";\n');
    execFileSync(process.execPath, [generatorPath], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PARITY_MANIFEST_OUTPUT: generatedPath,
        SENTRY_DEPENDENCY_REPO_PATH:
          process.env.SENTRY_DEPENDENCY_REPO_PATH ?? path.resolve("../sentry"),
        SENTRY_REPO_PATH: sentryClone,
      },
    });

    assert.equal(
      await readFile(generatedPath, "utf8"),
      await readFile("scraps-parity.json", "utf8"),
    );
    execFileSync(process.execPath, [validatorPath], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PARITY_MANIFEST_PATH: generatedPath,
        SENTRY_DEPENDENCY_REPO_PATH:
          process.env.SENTRY_DEPENDENCY_REPO_PATH ?? path.resolve("../sentry"),
        SENTRY_REPO_PATH: sentryClone,
      },
    });
  } finally {
    await rm(temporaryDirectory, { recursive: true });
  }
});

test("rejects a missing canonical module", async () => {
  await withChangedManifest(
    (changedManifest) => changedManifest.modules.pop(),
    (result) => {
      assert.notEqual(result.status, 0);
      assert.match(
        result.stderr,
        /module names must match the discovered regular Scraps inventory/,
      );
    },
  );
});

test("rejects a missing canonical public export", async () => {
  await withChangedManifest(
    (changedManifest) => {
      changedManifest.modules.find(
        ({ name }) => name === "checkbox",
      ).canonical.publicExports.runtime = [];
    },
    (result) => {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /canonical\.publicExports differs from the pinned contract/);
    },
  );
});

test("rejects a changed portable contract-input allowlist", async () => {
  await withChangedManifest(
    (changedManifest) => {
      changedManifest.scope.excludedContractInputs = [];
    },
    (result) => {
      assert.notEqual(result.status, 0);
      assert.match(
        result.stderr,
        /excludedContractInputs differs from the derived canonical closure/,
      );
    },
  );
});

test("rejects a missing affected-module contract-input exclusion", async () => {
  await withChangedManifest(
    (changedManifest) => {
      delete changedManifest.modules.find(({ name }) => name === "avatar").completion
        .excludedContractInputs;
    },
    (result) => {
      assert.notEqual(result.status, 0);
      assert.match(
        result.stderr,
        /modules\.avatar\.completion\.excludedContractInputs differs from scope/,
      );
    },
  );
});

test("rejects a changed affected-module contract-input exclusion", async () => {
  await withChangedManifest(
    (changedManifest) => {
      changedManifest.modules.find(
        ({ name }) => name === "button",
      ).completion.excludedContractInputs = [];
    },
    (result) => {
      assert.notEqual(result.status, 0);
      assert.match(
        result.stderr,
        /modules\.button\.completion\.excludedContractInputs differs from scope/,
      );
    },
  );
});

test("rejects a contract-input exclusion on an unaffected module", async () => {
  await withChangedManifest(
    (changedManifest) => {
      changedManifest.modules.find(
        ({ name }) => name === "info",
      ).completion.excludedContractInputs = ["tooltip.overlayStyle.serializedStyles"];
    },
    (result) => {
      assert.notEqual(result.status, 0);
      assert.match(
        result.stderr,
        /modules\.info\.completion\.excludedContractInputs differs from scope/,
      );
    },
  );
});

test("rejects an unsupported complete claim", async () => {
  await withChangedManifest(
    (changedManifest) => {
      const form = changedManifest.modules.find(({ name }) => name === "form");
      form.local.tests = [];
      form.completion = {
        state: "complete",
        complete: true,
        note: "Done.",
        excludedContractInputs: ["tooltip.overlayStyle.serializedStyles"],
      };
    },
    (result) => {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /does not meet the machine-checkable complete contract/);
    },
  );
});
