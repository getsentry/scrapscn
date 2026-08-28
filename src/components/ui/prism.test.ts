import { describe, expect, it, vi } from "vitest";

import { loadPrismLanguage, Prism } from "./prism";
import { prismLanguageLoaders, prismLanguageReloaders } from "./prism-language-loaders";
import { reloadPrismLanguage } from "./prism-language-reloaders.js";

const cssExtraTokens = ["hexcode", "color", "unit", "number"];
const openclHostCppToken = "type-opencl-host-cpp";
type PrismHook = NonNullable<(typeof Prism.hooks.all)[string]>[number];

function getOpenclHostCppToken(): unknown {
  return Reflect.get(Prism.languages.cpp, openclHostCppToken);
}

function setOpenclHostCppToken(value: unknown): void {
  Reflect.set(Prism.languages.cpp, openclHostCppToken, value);
}

function deleteOpenclHostCppToken(): void {
  Reflect.deleteProperty(Prism.languages.cpp, openclHostCppToken);
}

describe.sequential("Prism dependency loading", () => {
  it("reloads SCSS after CSS Extras modifies its CSS dependency", async () => {
    const initialWrapHooks = [...(Prism.hooks.all.wrap ?? [])];
    const initialMarkupHook = initialWrapHooks[0];
    const sentinelHook = vi.fn();
    Prism.hooks.add("wrap", sentinelHook);
    await expect(loadPrismLanguage("c")).resolves.toBe(true);
    const originalCssReloader = prismLanguageReloaders.css;
    const originalCReloader = prismLanguageReloaders.c;
    const originalScssReloader = prismLanguageReloaders.scss;
    const cssReloader = vi.fn(originalCssReloader);
    const cReloader = vi.fn(originalCReloader);
    const scssReloader = vi.fn(originalScssReloader);
    prismLanguageReloaders.css = cssReloader;
    prismLanguageReloaders.c = cReloader;
    prismLanguageReloaders.scss = scssReloader;

    try {
      await expect(loadPrismLanguage("scss")).resolves.toBe(true);
      expect(cssExtraTokens.every((token) => token in Prism.languages.scss)).toBe(false);

      await expect(loadPrismLanguage("css-extras")).resolves.toBe(true);
      expect(cssExtraTokens.every((token) => token in Prism.languages.scss)).toBe(true);
      expect(cssReloader).toHaveBeenCalledOnce();
      expect(scssReloader).toHaveBeenCalledOnce();
      expect(cReloader).not.toHaveBeenCalled();
      const wrapHooks = Prism.hooks.all.wrap ?? [];
      expect(wrapHooks).toHaveLength(initialWrapHooks.length + 1);
      expect(wrapHooks.filter((hook) => hook === sentinelHook)).toHaveLength(1);
      expect(wrapHooks).not.toContain(initialMarkupHook);
    } finally {
      prismLanguageReloaders.css = originalCssReloader;
      prismLanguageReloaders.c = originalCReloader;
      prismLanguageReloaders.scss = originalScssReloader;
      Prism.hooks.all.wrap = (Prism.hooks.all.wrap ?? []).filter((hook) => hook !== sentinelHook);
    }
  });

  it("reloads a language when its optional grammar loads later", async () => {
    await expect(loadPrismLanguage("vala")).resolves.toBe(true);
    const originalReloader = prismLanguageReloaders.vala;
    const reloader = vi.fn(originalReloader);
    prismLanguageReloaders.vala = reloader;

    try {
      await expect(loadPrismLanguage("regex")).resolves.toBe(true);
      expect(reloader).toHaveBeenCalledOnce();
    } finally {
      prismLanguageReloaders.vala = originalReloader;
    }
  });

  it("reloads an affected dependent after its modifier finishes", async () => {
    await expect(loadPrismLanguage("arduino")).resolves.toBe(true);

    const originalOpenclLoader = prismLanguageLoaders.opencl;
    const originalArduinoReloader = prismLanguageReloaders.arduino;
    const originalOpencl = Prism.languages.opencl;
    const originalArduino = Prism.languages.arduino;
    const originalCppBoolean = Prism.languages.cpp.boolean;
    let resolveOpencl = () => {};
    const openclLoader = vi.fn(
      () =>
        new Promise<unknown>((resolve) => {
          resolveOpencl = () => {
            Prism.languages.cpp.boolean = /opencl/;
            Prism.languages.opencl = Prism.languages.extend("c", {});
            resolve(undefined);
          };
        }),
    );
    const arduinoReloader = vi.fn(async () => {
      Prism.languages.arduino = Prism.languages.extend("cpp", {});
    });
    prismLanguageLoaders.opencl = openclLoader;
    prismLanguageReloaders.arduino = arduinoReloader;
    delete Prism.languages.opencl;

    try {
      const loading = loadPrismLanguage("opencl");
      await vi.waitFor(() => expect(openclLoader).toHaveBeenCalledOnce());
      await Promise.resolve();

      expect(arduinoReloader).not.toHaveBeenCalled();
      resolveOpencl();

      await expect(loading).resolves.toBe(true);
      expect(arduinoReloader).toHaveBeenCalledOnce();
      expect(Prism.languages.arduino.boolean).toEqual(/opencl/);
    } finally {
      prismLanguageLoaders.opencl = originalOpenclLoader;
      prismLanguageReloaders.arduino = originalArduinoReloader;
      if (originalOpencl) Prism.languages.opencl = originalOpencl;
      else delete Prism.languages.opencl;
      Prism.languages.arduino = originalArduino;
      if (originalCppBoolean) {
        Prism.languages.cpp.boolean = originalCppBoolean;
      } else {
        delete Prism.languages.cpp.boolean;
      }
    }
  });

  it("loads a new dependent after an existing modifier finishes", async () => {
    const originalCppLoader = prismLanguageLoaders.cpp;
    const originalOpenclLoader = prismLanguageLoaders.opencl;
    const originalArduinoLoader = prismLanguageLoaders.arduino;
    const originalOpenclReloader = prismLanguageReloaders.opencl;
    const originalCpp = Prism.languages.cpp;
    const originalOpencl = Prism.languages.opencl;
    const originalArduino = Prism.languages.arduino;
    let resolveOpencl = () => {};
    const cppLoader = vi.fn(async () => {
      Prism.languages.cpp = Prism.languages.extend("c", {});
    });
    const openclLoader = vi.fn(async () => {
      Prism.languages.opencl = Prism.languages.extend("c", {});
    });
    const openclReloader = vi.fn(
      () =>
        new Promise<unknown>((resolve) => {
          resolveOpencl = () => {
            setOpenclHostCppToken(/opencl/);
            Prism.languages.opencl = Prism.languages.extend("c", {});
            resolve(undefined);
          };
        }),
    );
    const arduinoLoader = vi.fn(async () => {
      Prism.languages.arduino = Prism.languages.extend("cpp", {});
    });
    prismLanguageLoaders.cpp = cppLoader;
    prismLanguageLoaders.opencl = openclLoader;
    prismLanguageLoaders.arduino = arduinoLoader;
    prismLanguageReloaders.opencl = openclReloader;
    delete Prism.languages.cpp;
    delete Prism.languages.opencl;
    delete Prism.languages.arduino;

    try {
      await expect(loadPrismLanguage("opencl")).resolves.toBe(true);
      const loading = loadPrismLanguage("arduino");
      await vi.waitFor(() => expect(openclReloader).toHaveBeenCalledOnce());
      await Promise.resolve();

      expect(arduinoLoader).not.toHaveBeenCalled();
      resolveOpencl();

      await expect(loading).resolves.toBe(true);
      expect(arduinoLoader).toHaveBeenCalledOnce();
      expect(Reflect.get(Prism.languages.arduino, openclHostCppToken)).toEqual(/opencl/);
    } finally {
      prismLanguageLoaders.cpp = originalCppLoader;
      prismLanguageLoaders.opencl = originalOpenclLoader;
      prismLanguageLoaders.arduino = originalArduinoLoader;
      prismLanguageReloaders.opencl = originalOpenclReloader;
      if (originalCpp) Prism.languages.cpp = originalCpp;
      else delete Prism.languages.cpp;
      if (originalOpencl) Prism.languages.opencl = originalOpencl;
      else delete Prism.languages.opencl;
      Prism.languages.arduino = originalArduino;
    }
  });

  it("restores a failed reload and reconciles it on retry", async () => {
    await expect(loadPrismLanguage("cpp")).resolves.toBe(true);
    await expect(loadPrismLanguage("arduino")).resolves.toBe(true);

    const originalOpenclLoader = prismLanguageLoaders.opencl;
    const originalOpenclReloader = prismLanguageReloaders.opencl;
    const originalArduinoReloader = prismLanguageReloaders.arduino;
    const originalOpencl = Prism.languages.opencl;
    const originalArduino = Prism.languages.arduino;
    const originalCppMarker = getOpenclHostCppToken();
    const applyOpencl = async () => {
      setOpenclHostCppToken(/recovered/);
      Prism.languages.opencl = Prism.languages.extend("c", {});
    };
    const openclLoader = vi.fn(applyOpencl);
    const openclReloader = vi.fn(applyOpencl);
    const arduinoReloader = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("reload failed"))
      .mockImplementationOnce(async () => {
        Prism.languages.arduino = Prism.languages.extend("cpp", {});
      });
    prismLanguageLoaders.opencl = openclLoader;
    prismLanguageReloaders.opencl = openclReloader;
    prismLanguageReloaders.arduino = arduinoReloader;
    delete Prism.languages.opencl;
    deleteOpenclHostCppToken();

    try {
      await expect(loadPrismLanguage("opencl")).resolves.toBe(false);
      expect(Prism.languages.arduino).toBe(originalArduino);

      await expect(loadPrismLanguage("opencl")).resolves.toBe(true);
      expect(openclLoader).toHaveBeenCalledOnce();
      expect(openclReloader).toHaveBeenCalledOnce();
      expect(arduinoReloader).toHaveBeenCalledTimes(2);
      expect(Reflect.get(Prism.languages.arduino, openclHostCppToken)).toEqual(/recovered/);
    } finally {
      prismLanguageLoaders.opencl = originalOpenclLoader;
      prismLanguageReloaders.opencl = originalOpenclReloader;
      prismLanguageReloaders.arduino = originalArduinoReloader;
      if (originalOpencl) Prism.languages.opencl = originalOpencl;
      else delete Prism.languages.opencl;
      Prism.languages.arduino = originalArduino;
      if (originalCppMarker !== undefined) {
        setOpenclHostCppToken(originalCppMarker);
      } else {
        deleteOpenclHostCppToken();
      }
    }
  });

  it("reconciles a failed transitive reload when that language retries directly", async () => {
    await expect(loadPrismLanguage("cpp")).resolves.toBe(true);
    await expect(loadPrismLanguage("arduino")).resolves.toBe(true);

    const originalOpenclLoader = prismLanguageLoaders.opencl;
    const originalArduinoReloader = prismLanguageReloaders.arduino;
    const originalOpencl = Prism.languages.opencl;
    const originalArduino = Prism.languages.arduino;
    const originalCppMarker = getOpenclHostCppToken();
    const openclLoader = vi.fn(async () => {
      setOpenclHostCppToken(/direct-retry/);
      Prism.languages.opencl = Prism.languages.extend("c", {});
    });
    const arduinoReloader = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("reload failed"))
      .mockImplementationOnce(async () => {
        Prism.languages.arduino = Prism.languages.extend("cpp", {});
      });
    prismLanguageLoaders.opencl = openclLoader;
    prismLanguageReloaders.arduino = arduinoReloader;
    delete Prism.languages.opencl;
    deleteOpenclHostCppToken();

    try {
      await expect(loadPrismLanguage("opencl")).resolves.toBe(false);
      expect(Prism.languages.arduino).toBe(originalArduino);

      await expect(loadPrismLanguage("arduino")).resolves.toBe(true);
      expect(openclLoader).toHaveBeenCalledOnce();
      expect(arduinoReloader).toHaveBeenCalledTimes(2);
      expect(Reflect.get(Prism.languages.arduino, openclHostCppToken)).toEqual(/direct-retry/);
    } finally {
      prismLanguageLoaders.opencl = originalOpenclLoader;
      prismLanguageReloaders.arduino = originalArduinoReloader;
      if (originalOpencl) Prism.languages.opencl = originalOpencl;
      else delete Prism.languages.opencl;
      Prism.languages.arduino = originalArduino;
      if (originalCppMarker !== undefined) {
        setOpenclHostCppToken(originalCppMarker);
      } else {
        deleteOpenclHostCppToken();
      }
    }
  });

  it("replaces dynamically loaded hooks while rebuilding a grammar", async () => {
    const sentinelHook = vi.fn();
    Prism.hooks.add("before-tokenize", sentinelHook);
    const hooksBeforeLoad = new Map(
      Object.entries(Prism.hooks.all).map(([name, hooks]) => [name, [...hooks]]),
    );
    await expect(loadPrismLanguage("django")).resolves.toBe(true);
    const hookCounts = Object.fromEntries(
      Object.entries(Prism.hooks.all).map(([name, hooks]) => [name, hooks.length]),
    );
    const initialGrammar = Prism.languages.django;
    const initialOwnedHooks = new Map<string, PrismHook[]>();
    for (const [name, hooks] of Object.entries(Prism.hooks.all)) {
      const ownedHooks = hooks.filter((hook) => !(hooksBeforeLoad.get(name) ?? []).includes(hook));
      if (ownedHooks.length > 0) initialOwnedHooks.set(name, ownedHooks);
    }
    expect([...initialOwnedHooks.values()].flat()).not.toHaveLength(0);

    try {
      reloadPrismLanguage("django");
      const firstReloadedGrammar = Prism.languages.django;
      const firstOwnedHooks = new Map<string, (typeof Prism.hooks.all)[string]>();
      expect(firstReloadedGrammar).not.toBe(initialGrammar);
      expect(Prism.hooks.all["before-tokenize"]).toContain(sentinelHook);
      for (const [name, hooks] of initialOwnedHooks) {
        const currentHooks = Prism.hooks.all[name] ?? [];
        expect(currentHooks.some((hook) => hooks.includes(hook))).toBe(false);
        const replacements = currentHooks.filter(
          (hook) => !(hooksBeforeLoad.get(name) ?? []).includes(hook),
        );
        expect(replacements).toHaveLength(hooks.length);
        firstOwnedHooks.set(name, replacements);
      }
      expect(
        Object.fromEntries(
          Object.entries(Prism.hooks.all).map(([name, hooks]) => [name, hooks.length]),
        ),
      ).toEqual(hookCounts);

      reloadPrismLanguage("django");
      expect(Prism.languages.django).not.toBe(firstReloadedGrammar);
      expect(Prism.hooks.all["before-tokenize"]).toContain(sentinelHook);
      for (const [name, hooks] of firstOwnedHooks) {
        const currentHooks = Prism.hooks.all[name] ?? [];
        expect(currentHooks.some((hook) => hooks.includes(hook))).toBe(false);
        expect(
          currentHooks.filter((hook) => !(hooksBeforeLoad.get(name) ?? []).includes(hook)),
        ).toHaveLength(hooks.length);
      }
      expect(
        Object.fromEntries(
          Object.entries(Prism.hooks.all).map(([name, hooks]) => [name, hooks.length]),
        ),
      ).toEqual(hookCounts);
      expect(
        Prism.highlight(
          "{% if captured %}{{ event_id }}{% endif %}",
          Prism.languages.django,
          "django",
        ),
      ).toContain("token tag keyword");
    } finally {
      Prism.hooks.all["before-tokenize"] = (Prism.hooks.all["before-tokenize"] ?? []).filter(
        (hook) => hook !== sentinelHook,
      );
    }
  });
});
