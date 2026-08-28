import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

import prismComponents from "prismjs/components.js";

const outputPath = new URL(
  process.env.PRISM_LOADERS_OUTPUT ?? "../src/components/ui/prism-language-loaders.ts",
  import.meta.url,
);
const reloaderOutputPath = new URL(
  process.env.PRISM_RELOADERS_OUTPUT ?? "../src/components/ui/prism-language-reloaders.js",
  import.meta.url,
);
const reloaderTypesOutputPath = new URL(
  process.env.PRISM_RELOADERS_TYPES_OUTPUT ?? "../src/components/ui/prism-language-reloaders.d.ts",
  import.meta.url,
);
const prismLicensePath = new URL("../node_modules/prismjs/LICENSE", import.meta.url);
const languages = Object.entries(prismComponents.languages)
  .filter(([language]) => language !== "meta")
  .sort(([a], [b]) => a.localeCompare(b));

const require = createRequire(import.meta.url);

function collectPreloadedLanguageHookIndexes() {
  const Prism = require("prismjs/components/prism-core.js");
  const previousPrism = globalThis.Prism;
  const hookIndexes = {};
  globalThis.Prism = Prism;

  try {
    for (const language of ["markup", "css", "clike", "javascript"]) {
      const languageHookIndexes = {};
      const addHook = Prism.hooks.add;
      Prism.hooks.add = function addOwnedHook(name, callback) {
        const indexes = languageHookIndexes[name] ?? [];
        indexes.push(Prism.hooks.all[name]?.length ?? 0);
        languageHookIndexes[name] = indexes;
        return addHook.call(this, name, callback);
      };
      try {
        require(`prismjs/components/prism-${language}.js`);
      } finally {
        Prism.hooks.add = addHook;
      }
      if (Object.keys(languageHookIndexes).length > 0) {
        hookIndexes[language] = languageHookIndexes;
      }
    }
  } finally {
    if (previousPrism === undefined) delete globalThis.Prism;
    else globalThis.Prism = previousPrism;
  }

  return hookIndexes;
}

const preloadedLanguageHookIndexes = collectPreloadedLanguageHookIndexes();

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const metadataByLanguage = new Map(languages);
const dependencyCache = new Map();

function getDependencies(language, stack = []) {
  const cached = dependencyCache.get(language);
  if (cached) return cached;
  if (stack.includes(language)) {
    throw new Error(`Circular Prism dependency: ${[...stack, language].join(" -> ")}`);
  }

  const metadata = metadataByLanguage.get(language);
  const dependencies = new Set([
    ...toArray(metadata?.require),
    ...toArray(metadata?.optional),
    ...toArray(metadata?.modify),
  ]);
  for (const dependency of [...dependencies]) {
    for (const transitiveDependency of getDependencies(dependency, [...stack, language])) {
      dependencies.add(transitiveDependency);
    }
  }
  dependencyCache.set(language, dependencies);
  return dependencies;
}

const modifiers = languages.flatMap(([language, metadata]) =>
  toArray(metadata.modify).length > 0 ? [[language, toArray(metadata.modify)]] : [],
);

const loaders = languages
  .map(
    ([language]) =>
      `  ${JSON.stringify(language)}: () => import(${JSON.stringify(
        `prismjs/components/prism-${language}.min.js`,
      )}),`,
  )
  .join("\n");
const dependencies = languages
  .flatMap(([language, metadata]) => {
    const required = toArray(metadata.require);
    if (required.length === 0) return [];
    return [`  ${JSON.stringify(language)}: ${JSON.stringify(required)},`];
  })
  .join("\n");
const optionalDependencies = languages
  .flatMap(([language, metadata]) => {
    const optional = toArray(metadata.optional);
    if (optional.length === 0) return [];
    return [`  ${JSON.stringify(language)}: ${JSON.stringify(optional)},`];
  })
  .join("\n");
const modifications = languages
  .flatMap(([language, metadata]) => {
    const modified = toArray(metadata.modify);
    if (modified.length === 0) return [];
    return [`  ${JSON.stringify(language)}: ${JSON.stringify(modified)},`];
  })
  .join("\n");
const reloadableLanguages = languages.filter(([language]) => {
  const dependencyTree = [language, ...getDependencies(language)];
  const hasOptionalDependency = dependencyTree.some(
    (dependency) => toArray(metadataByLanguage.get(dependency)?.optional).length > 0,
  );
  const affectedLanguages = new Set(dependencyTree);
  const canBeModified = modifiers.some(([, modified]) =>
    modified.some((target) => affectedLanguages.has(target)),
  );
  return hasOptionalDependency || canBeModified;
});
const reloaders = reloadableLanguages
  .map(
    ([language]) =>
      `  ${JSON.stringify(language)}: () => import("./prism-language-reloaders.js").then(({ reloadPrismLanguage }) => reloadPrismLanguage(${JSON.stringify(language)})),`,
  )
  .join("\n");
const aliases = languages
  .flatMap(([language, metadata]) => {
    if (!metadata.alias) return [];
    const values = Array.isArray(metadata.alias) ? metadata.alias : [metadata.alias];
    return values.map((alias) => `  ${JSON.stringify(alias)}: ${JSON.stringify(language)},`);
  })
  .sort()
  .join("\n");

const source = `export type PrismLanguageLoader = () => Promise<unknown>;

export const prismLanguageLoaders: Record<string, PrismLanguageLoader> = {
${loaders}
};

export const prismLanguageDependencies: Record<string, readonly string[]> = {
${dependencies}
};

export const prismLanguageOptionalDependencies: Record<string, readonly string[]> = {
${optionalDependencies}
};

export const prismLanguageModifications: Record<string, readonly string[]> = {
${modifications}
};

export const prismLanguageReloaders: Record<string, PrismLanguageLoader> = {
${reloaders}
};

export const prismLanguageAliases: Record<string, string> = {
${aliases}
};

export const prismPreloadedLanguageHookIndexes: Record<string, Record<string, readonly number[]>> = ${JSON.stringify(preloadedLanguageHookIndexes, null, 2)};
`;

const reloaderEntries = await Promise.all(
  reloadableLanguages.map(async ([language]) => {
    const componentPath = new URL(
      `../node_modules/prismjs/components/prism-${language}.min.js`,
      import.meta.url,
    );
    const componentSource = await readFile(componentPath, "utf8");
    return `  ${JSON.stringify(language)}: () => {\n${componentSource}\n  },`;
  }),
);
const prismLicense = (await readFile(prismLicensePath, "utf8")).trim();
const reloaderSource = `/*!
${prismLicense}
*/
/* eslint-disable */
import Prism from "prismjs";

const prismLanguageReloaders = {
${reloaderEntries.join("\n")}
};

const languageHooksKey = Symbol.for("scrapscn.prism.registered-language-hooks");
const registeredLanguageHooks = Prism[languageHooksKey] ?? new Map();
Prism[languageHooksKey] = registeredLanguageHooks;

function snapshotHooks() {
  return new Map(
    Object.entries(Prism.hooks.all).map(([name, hooks]) => [name, [...hooks]])
  );
}

function restoreHooks(snapshot) {
  for (const name of Object.keys(Prism.hooks.all)) {
    if (!snapshot.has(name)) delete Prism.hooks.all[name];
  }
  for (const [name, hooks] of snapshot) Prism.hooks.all[name] = hooks;
}

function collectAddedHooks(snapshot) {
  const addedHooks = new Map();
  for (const [name, hooks] of Object.entries(Prism.hooks.all)) {
    const previousHooks = snapshot.get(name) ?? [];
    const added = hooks.filter(hook => !previousHooks.includes(hook));
    if (added.length > 0) addedHooks.set(name, added);
  }
  return addedHooks;
}

function removeHooks(hooksToRemove) {
  for (const [name, removedHooks] of hooksToRemove) {
    const hooks = Prism.hooks.all[name];
    if (!hooks) continue;
    Prism.hooks.all[name] = hooks.filter(hook => !removedHooks.includes(hook));
  }
}

export function reloadPrismLanguage(language) {
  const reload = prismLanguageReloaders[language];
  if (!reload) return;
  const hookSnapshot = snapshotHooks();
  try {
    reload();
  } catch (error) {
    restoreHooks(hookSnapshot);
    throw error;
  }

  const addedHooks = collectAddedHooks(hookSnapshot);
  const previousHooks = registeredLanguageHooks.get(language);
  if (previousHooks) removeHooks(previousHooks);
  registeredLanguageHooks.set(language, addedHooks);
}
`;
const reloaderTypesSource = `export function reloadPrismLanguage(language: string): void;
`;

await Promise.all([
  writeFile(outputPath, source),
  writeFile(reloaderOutputPath, reloaderSource),
  writeFile(reloaderTypesOutputPath, reloaderTypesSource),
]);
