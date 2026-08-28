import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const registry = JSON.parse(await readFile("registry.json", "utf8"));
const parityManifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
const itemsByName = new Map(registry.items.map((item) => [item.name, item]));

function dependencyName(dependency) {
  const match = dependency.match(/\/([^/]+)\.json$/);
  return match?.[1] ?? dependency;
}

function registryClosure(itemName, names = new Set()) {
  if (names.has(itemName)) return names;
  names.add(itemName);
  for (const dependency of itemsByName.get(itemName)?.registryDependencies ?? []) {
    registryClosure(dependencyName(dependency), names);
  }
  return names;
}

function resolveRelativeImport(filePath, specifier, availablePaths) {
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(filePath), specifier));
  return [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`, `${base}/index.tsx`].find(
    (candidate) => availablePaths.has(candidate),
  );
}

function packageName(specifier) {
  return specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : specifier.split("/")[0];
}

function declaredPackageName(dependency) {
  return dependency.startsWith("@") ? dependency.replace(/@[^@]+$/, "") : dependency.split("@")[0];
}

test("the registry has one unique generated artifact per item", async () => {
  assert.equal(itemsByName.size, registry.items.length);
  for (const item of registry.items) {
    const generated = JSON.parse(await readFile(`public/r/${item.name}.json`, "utf8"));
    const { files: sourceFiles, ...sourceMetadata } = item;
    for (const [key, value] of Object.entries(sourceMetadata)) {
      assert.deepEqual(generated[key], value, `${item.name} has stale generated ${key} metadata`);
    }
    assert.deepEqual(
      generated.files.map(({ content, ...metadata }) => metadata),
      sourceFiles,
      `${item.name} has stale generated file metadata`,
    );
    for (const generatedFile of generated.files) {
      assert.equal(
        generatedFile.content,
        await readFile(generatedFile.path, "utf8"),
        `${item.name} has a stale generated copy of ${generatedFile.path}`,
      );
    }
  }
});

test("every component-family registry item and dependency is resolvable", () => {
  for (const parityModule of parityManifest.modules) {
    assert.ok(
      parityModule.local.registryItems.length > 0,
      `${parityModule.name} needs a registry item`,
    );
    for (const itemName of parityModule.local.registryItems) assert.ok(itemsByName.has(itemName));
  }
  for (const item of registry.items) {
    for (const dependency of item.registryDependencies ?? []) {
      assert.ok(
        itemsByName.has(dependencyName(dependency)),
        `${item.name} has unknown dependency ${dependency}`,
      );
    }
  }
});

test("relative source imports stay inside each registry dependency closure", async () => {
  for (const item of registry.items) {
    const closure = registryClosure(item.name);
    const availablePaths = new Set(
      [...closure].flatMap((itemName) =>
        itemsByName.get(itemName).files.map(({ path: filePath }) => filePath),
      ),
    );
    availablePaths.add("src/lib/utils.ts");
    for (const itemName of closure) {
      const generated = JSON.parse(await readFile(`public/r/${itemName}.json`, "utf8"));
      for (const file of generated.files) {
        const relativeImports = [
          ...file.content.matchAll(/(?:from\s+|import\s*\()(["'])(\.[^"']+)\1/g),
        ].map((match) => match[2]);
        for (const specifier of relativeImports) {
          assert.ok(
            resolveRelativeImport(file.path, specifier, availablePaths),
            `${item.name} cannot deliver ${file.path}, which imports ${specifier}`,
          );
        }
      }
    }
  }
});

test("package imports are declared by each registry dependency closure", async () => {
  for (const item of registry.items) {
    const closure = registryClosure(item.name);
    const declaredPackages = new Set([
      "next",
      "react",
      "react-dom",
      "tailwindcss",
      ...[...closure].flatMap((itemName) =>
        (itemsByName.get(itemName).dependencies ?? []).map(declaredPackageName),
      ),
    ]);
    for (const itemName of closure) {
      const generated = JSON.parse(await readFile(`public/r/${itemName}.json`, "utf8"));
      for (const file of generated.files) {
        const scriptImports = [
          ...file.content.matchAll(/(?:from\s+|import\s*\()(["'])([^."'][^"']*)\1/g),
        ].map((match) => match[2]);
        const cssImports = [
          ...file.content.matchAll(/@import\s+(?:url\()?(["'])([^."'][^"']*)\1/g),
        ].map((match) => match[2]);
        const packageImports = [...scriptImports, ...cssImports].map(packageName);
        for (const importedPackage of packageImports) {
          const matchingTypesPackage = importedPackage.startsWith("@")
            ? `@types/${importedPackage.slice(1).replace("/", "__")}`
            : `@types/${importedPackage}`;
          assert.ok(
            declaredPackages.has(importedPackage) || declaredPackages.has(matchingTypesPackage),
            `${item.name} imports undeclared package ${importedPackage} through ${file.path}`,
          );
        }
      }
    }
  }
});
