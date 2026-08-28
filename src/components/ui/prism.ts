import Prism from "prismjs";

import {
  prismLanguageAliases,
  prismLanguageDependencies,
  prismLanguageLoaders,
  prismLanguageModifications,
  prismLanguageOptionalDependencies,
  prismPreloadedLanguageHookIndexes,
  prismLanguageReloaders,
} from "./prism-language-loaders";

Prism.manual = true;

const languageMap = new Map<string, string>();

for (const language of Object.keys(prismLanguageLoaders)) languageMap.set(language, language);
for (const [alias, language] of Object.entries(prismLanguageAliases))
  languageMap.set(alias, language);

const extraAliases: Record<string, string> = {
  cc: "cpp",
  erl: "erlang",
  ex: "elixir",
  h: "c",
  m: "objectivec",
  pl: "perl",
  pm: "perl",
  pyx: "python",
  rs: "rust",
  jbuilder: "ruby",
  ru: "ruby",
  rake: "ruby",
  rabl: "ruby",
  cjs: "javascript",
  mjs: "javascript",
  jsbundle: "javascript",
  bundle: "javascript",
  vue: "javascript",
  svelte: "javascript",
  "js?": "javascript",
  "ts?": "typescript",
  "tsx?": "tsx",
  mts: "typescript",
  clj: "clojure",
  cljc: "clojure",
  cljs: "clojure",
  php5: "php",
  phtml: "php",
  arb: "json",
  ps1: "powershell",
  jinja: "jinja2",
  gd: "gdscript",
};

export function getPrismLanguage(language: string): string | undefined {
  const normalized = language.toLowerCase();
  return languageMap.get(extraAliases[normalized] ?? normalized);
}

const languageLoads = new Map<string, Promise<boolean>>();
const loadedGrammarlessComponents = new Set<string>();
const incompleteLanguageLoads = new Set<string>();
const completedLanguageLoads = new Set(
  Object.keys(prismLanguageLoaders).filter((language) => Prism.languages[language]),
);
let languageLoadQueue = Promise.resolve();

type PrismHook = NonNullable<(typeof Prism.hooks.all)[string]>[number];
type PrismHookSnapshot = Map<string, PrismHook[]>;

const languageHooksKey = Symbol.for("scrapscn.prism.registered-language-hooks");
const registeredLanguageHooks: unknown = Reflect.get(Prism, languageHooksKey);
const prismLanguageHooks: Map<string, PrismHookSnapshot> =
  registeredLanguageHooks instanceof Map
    ? registeredLanguageHooks
    : new Map<string, PrismHookSnapshot>();
Reflect.set(Prism, languageHooksKey, prismLanguageHooks);

for (const [language, hookIndexes] of Object.entries(prismPreloadedLanguageHookIndexes)) {
  if (prismLanguageHooks.has(language)) continue;
  const languageHooks: PrismHookSnapshot = new Map();
  for (const [name, indexes] of Object.entries(hookIndexes)) {
    const hooks = Prism.hooks.all[name] ?? [];
    const ownedHooks = indexes.flatMap((index) => {
      const hook = hooks[index];
      return hook ? [hook] : [];
    });
    if (ownedHooks.length > 0) languageHooks.set(name, ownedHooks);
  }
  prismLanguageHooks.set(language, languageHooks);
}

function snapshotPrismHooks(): PrismHookSnapshot {
  return new Map(Object.entries(Prism.hooks.all).map(([name, hooks]) => [name, [...hooks]]));
}

function collectAddedPrismHooks(
  snapshot: ReadonlyMap<string, readonly PrismHook[]>,
): PrismHookSnapshot {
  const addedHooks: PrismHookSnapshot = new Map();
  for (const [name, hooks] of Object.entries(Prism.hooks.all)) {
    const previousHooks = snapshot.get(name) ?? [];
    const added = hooks.filter((hook) => !previousHooks.includes(hook));
    if (added.length > 0) addedHooks.set(name, added);
  }
  return addedHooks;
}

function removePrismHooks(hooksToRemove: ReadonlyMap<string, readonly PrismHook[]>) {
  for (const [name, removedHooks] of hooksToRemove) {
    const hooks = Prism.hooks.all[name];
    if (!hooks) continue;
    Prism.hooks.all[name] = hooks.filter((hook) => !removedHooks.includes(hook));
  }
}

type PrismPluginImporter = () => Promise<unknown>;

export async function loadPrismLineHighlight(
  importPlugin: PrismPluginImporter = () =>
    import("prismjs/plugins/line-highlight/prism-line-highlight"),
): Promise<boolean> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await importPlugin();
      return true;
    } catch {
      continue;
    }
  }
  console.warn("Cannot load the Prism line-highlight plugin.");
  return false;
}

function isLanguageLoaded(language: string): boolean {
  return (
    completedLanguageLoads.has(language) &&
    (Boolean(Prism.languages[language]) || loadedGrammarlessComponents.has(language))
  );
}

function getLanguageDependencies(language: string): readonly string[] {
  return [
    ...(prismLanguageDependencies[language] ?? []),
    ...(prismLanguageOptionalDependencies[language] ?? []),
    ...(prismLanguageModifications[language] ?? []),
  ];
}

const languageDependencyCache = new Map<string, ReadonlySet<string>>();

function getTransitiveLanguageDependencies(
  language: string,
  stack: readonly string[] = [],
): ReadonlySet<string> {
  const cached = languageDependencyCache.get(language);
  if (cached) return cached;
  if (stack.includes(language)) {
    throw new Error(`Circular Prism dependency: ${[...stack, language].join(" -> ")}`);
  }

  const dependencies = new Set(getLanguageDependencies(language));
  for (const dependency of [...dependencies]) {
    for (const transitiveDependency of getTransitiveLanguageDependencies(dependency, [
      ...stack,
      language,
    ])) {
      dependencies.add(transitiveDependency);
    }
  }
  languageDependencyCache.set(language, dependencies);
  return dependencies;
}

function getLoadedLanguages(): Set<string> {
  return new Set(
    Object.keys(prismLanguageLoaders).filter((language) => isLanguageLoaded(language)),
  );
}

function createLanguageLoadSet(
  language: string,
  loadedLanguages: ReadonlySet<string>,
): Set<string> {
  const loadSet = new Set([language]);

  const addRequirements = (requiredBy: string) => {
    for (const dependency of prismLanguageDependencies[requiredBy] ?? []) {
      if (loadedLanguages.has(dependency) || loadSet.has(dependency)) continue;
      loadSet.add(dependency);
      addRequirements(dependency);
    }
  };
  addRequirements(language);

  let additions = new Set(loadSet);
  while (additions.size > 0) {
    const nextAdditions = new Set<string>();
    for (const addedLanguage of additions) {
      for (const modifiedLanguage of prismLanguageModifications[addedLanguage] ?? []) {
        if (loadedLanguages.has(modifiedLanguage) && !loadSet.has(modifiedLanguage)) {
          nextAdditions.add(modifiedLanguage);
        }
      }
    }

    for (const loadedLanguage of loadedLanguages) {
      if (loadSet.has(loadedLanguage)) continue;
      const dependencies = getTransitiveLanguageDependencies(loadedLanguage);
      if ([...loadSet].some((dependency) => dependencies.has(dependency))) {
        nextAdditions.add(loadedLanguage);
      }
    }

    additions = new Set([...nextAdditions].filter((addedLanguage) => !loadSet.has(addedLanguage)));
    for (const addedLanguage of additions) loadSet.add(addedLanguage);
  }

  return loadSet;
}

function hasDependencyPath(
  dependencyMap: ReadonlyMap<string, ReadonlySet<string>>,
  language: string,
  target: string,
  visited = new Set<string>(),
): boolean {
  if (language === target) return true;
  if (visited.has(language)) return false;
  visited.add(language);

  return [...(dependencyMap.get(language) ?? [])].some((dependency) =>
    hasDependencyPath(dependencyMap, dependency, target, visited),
  );
}

function createLanguageLoadDependencies(
  loadSet: ReadonlySet<string>,
): ReadonlyMap<string, ReadonlySet<string>> {
  const dependencyMap = new Map<string, Set<string>>(
    [...loadSet].map((language) => [
      language,
      new Set(getLanguageDependencies(language).filter((dependency) => loadSet.has(dependency))),
    ]),
  );
  const languages = [...loadSet].sort();

  for (const language of languages) {
    const dependencies = dependencyMap.get(language);
    if (!dependencies) continue;
    const transitiveDependencies = getTransitiveLanguageDependencies(language);
    const languageModifications = new Set(prismLanguageModifications[language] ?? []);

    for (const modifier of languages) {
      if (
        modifier === language ||
        getTransitiveLanguageDependencies(modifier).has(language) ||
        hasDependencyPath(dependencyMap, modifier, language)
      ) {
        continue;
      }
      if (
        (prismLanguageModifications[modifier] ?? []).some(
          (modifiedLanguage) =>
            transitiveDependencies.has(modifiedLanguage) &&
            !languageModifications.has(modifiedLanguage),
        )
      ) {
        dependencies.add(modifier);
      }
    }
  }

  return dependencyMap;
}

async function executeLanguageLoader(language: string, reload: boolean): Promise<boolean> {
  const loader = reload ? prismLanguageReloaders[language] : prismLanguageLoaders[language];
  if (!loader) return false;

  const previousGrammar = Prism.languages[language];
  const wasGrammarless = loadedGrammarlessComponents.has(language);
  const wasCompleted = completedLanguageLoads.has(language);
  const hookSnapshot = snapshotPrismHooks();
  if (reload) {
    delete Prism.languages[language];
    loadedGrammarlessComponents.delete(language);
  }
  try {
    await loader();
  } catch {
    if (previousGrammar !== undefined) Prism.languages[language] = previousGrammar;
    else delete Prism.languages[language];
    if (wasGrammarless) loadedGrammarlessComponents.add(language);
    else loadedGrammarlessComponents.delete(language);
    if (wasCompleted) completedLanguageLoads.add(language);
    else completedLanguageLoads.delete(language);
    removePrismHooks(collectAddedPrismHooks(hookSnapshot));
    console.warn(
      `Cannot download Prism grammar file for \`${language}\`. Check the internet connection, and the \`lang\` argument passed to \`loadPrismLanguage()\`.`,
    );
    return false;
  }

  if (Prism.languages[language]) {
    loadedGrammarlessComponents.delete(language);
  } else {
    loadedGrammarlessComponents.add(language);
  }
  completedLanguageLoads.add(language);
  if (!reload) {
    prismLanguageHooks.set(language, collectAddedPrismHooks(hookSnapshot));
  }
  return true;
}

async function runLanguageLoad(language: string): Promise<boolean> {
  if (isLanguageLoaded(language) && !incompleteLanguageLoads.has(language)) {
    return true;
  }

  const loadedLanguages = getLoadedLanguages();
  const loadSet = createLanguageLoadSet(language, loadedLanguages);
  const dependencyMap = createLanguageLoadDependencies(loadSet);
  const componentLoads = new Map<string, Promise<boolean>>();

  const loadComponent = (component: string): Promise<boolean> => {
    const existing = componentLoads.get(component);
    if (existing) return existing;

    const load = (async () => {
      const dependencies = await Promise.all(
        [...(dependencyMap.get(component) ?? [])].map(loadComponent),
      );
      if (dependencies.some((loaded) => !loaded)) {
        incompleteLanguageLoads.add(component);
        return false;
      }
      const loaded = await executeLanguageLoader(component, loadedLanguages.has(component));
      if (loaded) incompleteLanguageLoads.delete(component);
      else incompleteLanguageLoads.add(component);
      return loaded;
    })();
    componentLoads.set(component, load);
    return load;
  };

  const loads = await Promise.all([...loadSet].map(loadComponent));
  const loaded = loads.every(Boolean) && isLanguageLoaded(language);
  if (loaded) incompleteLanguageLoads.delete(language);
  else incompleteLanguageLoads.add(language);
  return loaded;
}

function loadResolvedPrismLanguage(language: string): Promise<boolean> {
  if (isLanguageLoaded(language) && !incompleteLanguageLoads.has(language)) {
    return Promise.resolve(true);
  }
  const existing = languageLoads.get(language);
  if (existing) return existing;

  const load = languageLoadQueue.then(() => runLanguageLoad(language));
  languageLoadQueue = load.then(
    () => undefined,
    () => undefined,
  );
  languageLoads.set(language, load);
  const clearLoad = () => languageLoads.delete(language);
  void load.then(clearLoad, clearLoad);
  return load;
}

export async function loadPrismLanguage(language: string): Promise<boolean> {
  const resolvedLanguage = getPrismLanguage(language);
  if (!resolvedLanguage) return false;
  return loadResolvedPrismLanguage(resolvedLanguage);
}

export { Prism };
