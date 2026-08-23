import { describe, expect, it, vi } from "vitest";

import { prismLanguageLoaders } from "./prism-language-loaders";
import { loadPrismLanguage, Prism } from "./prism";

const cssExtraTokens = ["hexcode", "color", "unit", "number"];

describe("concurrent Prism dependency loading", () => {
  it("keeps SCSS current when CSS Extras starts while SCSS loads", async () => {
    const [scssLoaded, extrasLoaded] = await Promise.all([
      loadPrismLanguage("scss"),
      loadPrismLanguage("css-extras"),
    ]);

    expect(scssLoaded).toBe(true);
    expect(extrasLoaded).toBe(true);
    expect(cssExtraTokens.every(token => token in Prism.languages.scss)).toBe(
      true
    );
  });

  it("loads independent required grammars in parallel", async () => {
    const dependencyNames = ["java", "mata", "python"];
    const originalLoaders = new Map(
      dependencyNames.map(language => [
        language,
        prismLanguageLoaders[language],
      ])
    );
    const originalStataLoader = prismLanguageLoaders.stata;
    const originalGrammars = new Map(
      [...dependencyNames, "stata"].map(language => [
        language,
        Prism.languages[language],
      ])
    );
    const resolvers = new Map<string, () => void>();

    for (const language of dependencyNames) {
      prismLanguageLoaders[language] = vi.fn(
        () =>
          new Promise<unknown>(resolve => {
            resolvers.set(language, () => {
              Prism.languages[language] = Prism.languages.extend("clike", {});
              resolve(undefined);
            });
          })
      );
      delete Prism.languages[language];
    }

    const stataLoader = vi.fn(async () => {
      Prism.languages.stata = Prism.languages.extend("clike", {});
    });
    prismLanguageLoaders.stata = stataLoader;
    delete Prism.languages.stata;

    try {
      const loading = loadPrismLanguage("stata");
      await vi.waitFor(() => expect(resolvers.size).toBe(dependencyNames.length));
      expect(stataLoader).not.toHaveBeenCalled();

      for (const resolve of resolvers.values()) resolve();

      await expect(loading).resolves.toBe(true);
      expect(stataLoader).toHaveBeenCalledOnce();
    } finally {
      for (const [language, loader] of originalLoaders) {
        prismLanguageLoaders[language] = loader;
      }
      prismLanguageLoaders.stata = originalStataLoader;
      for (const [language, grammar] of originalGrammars) {
        if (grammar) Prism.languages[language] = grammar;
        else delete Prism.languages[language];
      }
    }
  });
});
