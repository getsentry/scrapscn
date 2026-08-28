import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

import { excludedContractInputDescriptors } from "../../scripts/parity-contract-inputs.mjs";

const emotionImportPattern = /from ["']@emotion\//;
const nonTailwindImplementationPattern = /\.module\.css["']|<style\b/;
const tailwindTranslationDebt = [];

test("forbids CSS-in-JS styling runtimes in Scraps clone modules", async () => {
  const filenames = (await readdir("src/components/ui")).filter(
    (filename) => filename.endsWith(".ts") || filename.endsWith(".tsx"),
  );
  const stylingRuntimeFiles = [];

  for (const filename of filenames) {
    const path = `src/components/ui/${filename}`;
    if (emotionImportPattern.test(await readFile(path, "utf8"))) {
      stylingRuntimeFiles.push(path);
    }
  }

  assert.deepEqual(stylingRuntimeFiles, []);

  const packageJson = JSON.parse(await readFile("package.json", "utf8"));
  assert.deepEqual(
    Object.keys(packageJson.dependencies).filter((name) => name.startsWith("@emotion/")),
    [],
  );
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  assert.deepEqual(
    registry.items
      .flatMap((item) => item.dependencies ?? [])
      .filter((dependency) => dependency.startsWith("@emotion/")),
    [],
  );

  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  assert.equal(
    manifest.scope.excludedContractInputs.length,
    excludedContractInputDescriptors.length,
  );
  for (const [index, recordedContractInput] of manifest.scope.excludedContractInputs.entries()) {
    const { affectedModules, evidence, ...recordedDescriptor } = recordedContractInput;
    assert.deepEqual(recordedDescriptor, excludedContractInputDescriptors[index]);
    assert.deepEqual(
      evidence.map(({ moduleName }) => moduleName),
      affectedModules,
    );
    for (const moduleName of affectedModules) {
      const parityModule = manifest.modules.find((candidate) => candidate.name === moduleName);
      assert.ok(parityModule.completion.excludedContractInputs.includes(recordedContractInput.id));
    }
  }
  const expectedModuleInputs = new Map(
    manifest.scope.excludedContractInputs.map(({ affectedModules, id }) => [
      id,
      new Set(affectedModules),
    ]),
  );
  for (const parityModule of manifest.modules) {
    const expected = [...expectedModuleInputs]
      .filter(([, affectedModules]) => affectedModules.has(parityModule.name))
      .map(([id]) => id)
      .sort();
    assert.deepEqual(parityModule.completion.excludedContractInputs ?? [], expected);
  }
  for (const moduleName of tailwindTranslationDebt) {
    const parityModule = manifest.modules.find((candidate) => candidate.name === moduleName);
    assert.equal(parityModule.completion.state, "partial");
  }

  for (const parityModule of manifest.modules.filter(
    (candidate) => candidate.completion.complete,
  )) {
    for (const path of parityModule.local.implementationPaths) {
      assert.doesNotMatch(
        await readFile(path, "utf8"),
        nonTailwindImplementationPattern,
        `${parityModule.name} claims completion while ${path} still owns non-Tailwind styling`,
      );
    }
  }
});
