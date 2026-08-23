import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import ts from "typescript";

test("records the complete regular Scraps Code delivery", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const code = manifest.modules.find(({ name }) => name === "code");

  assert.deepEqual(code.canonical.sourcePaths, [
    "static/app/components/core/button/button.tsx",
    "static/app/components/core/button/styles.tsx",
    "static/app/components/core/button/types.tsx",
    "static/app/components/core/button/useButtonFunctionality.tsx",
    "static/app/components/core/code/codeBlock.tsx",
    "static/app/components/core/code/index.tsx",
    "static/app/components/core/code/inlineCode.tsx",
    "static/app/components/core/layout/container.tsx",
    "static/app/components/core/layout/index.tsx",
    "static/app/components/core/layout/styles.tsx",
    "static/app/components/core/tooltip/tooltip.tsx",
    "static/app/components/overlay.tsx",
    "static/app/components/overlayArrow.tsx",
    "static/app/icons/iconCopy.tsx",
    "static/app/icons/svgIcon.tsx",
    "static/app/icons/useIconDefaults.tsx",
    "static/app/locale.tsx",
    "static/app/styles/global.tsx",
    "static/app/utils/prism.tsx",
    "static/app/utils/theme/scraps/theme/base.tsx",
    "static/app/utils/theme/scraps/theme/dark.tsx",
    "static/app/utils/theme/scraps/theme/light.tsx",
    "static/app/utils/theme/scraps/tokens/color.tsx",
    "static/app/utils/theme/scraps/tokens/size.tsx",
    "static/app/utils/theme/scraps/tokens/typography.tsx",
    "static/app/utils/theme/theme.tsx",
    "static/app/utils/useHoverOverlay.tsx",
  ]);
  assert.deepEqual(code.canonical.publicExports, {
    runtime: ["CodeBlock", "InlineCode", "inlineCodeStyles"],
    types: [],
  });
  assert.deepEqual(code.local.implementationPaths, [
    "src/components/ui/code-block.tsx",
    "src/components/ui/code-messages.tsx",
    "src/components/ui/code.tsx",
  ]);
  assert.deepEqual(code.local.implementedExports, {
    runtime: [
      "CodeBlock",
      "CodeMessagesProvider",
      "InlineCode",
      "defaultCodeMessages",
      "inlineCodeStyles",
      "useCodeMessages",
    ],
    types: ["CodeMessages"],
  });
  assert.deepEqual(code.local.registryItems, ["code"]);
  assert.deepEqual(code.local.stories, ["src/components/ui/code.stories.tsx"]);
  assert.deepEqual(code.local.tests, [
    "src/components/ui/code.test.tsx",
    "src/components/ui/prism-concurrent.test.ts",
    "src/components/ui/prism.test.ts",
    "tests/e2e/playground.spec.ts",
    "tests/parity/code.test.mjs",
    "tests/types/code-types.test.tsx",
  ]);
  assert.deepEqual(code.local.figmaNodes, []);
  assert.equal(code.local.playgroundPath, "/?component=code");
  assert.equal(code.completion.complete, true);
});

test("publishes Code as a standalone registry item", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const code = registry.items.find(({ name }) => name === "code");

  assert.deepEqual(code.dependencies, [
    "@base-ui/react@1.5.0",
    "@emotion/serialize@1.3.3",
    "@fontsource/roboto-mono@5.2.9",
    "@fontsource/rubik@5.2.8",
    "@types/prismjs@1.26.0",
    "prismjs@1.30.0",
  ]);
  assert.deepEqual(code.registryDependencies, []);
  assert.equal(code.cssVars.light["scraps-code-focus-mask"], "#ffffff");
  assert.equal(code.cssVars.dark["scraps-code-focus-mask"], "#2e2936");
  assert.deepEqual(code.files, [
    {
      path: "THIRD_PARTY_NOTICES.md",
      type: "registry:file",
      target: "src/components/ui/SENTRY_SOURCE_NOTICE.md",
    },
    {
      path: "src/components/ui/code.module.css",
      type: "registry:file",
      target: "src/components/ui/code.module.css",
    },
    { path: "src/components/ui/code-block.tsx", type: "registry:ui" },
    { path: "src/components/ui/code-messages.tsx", type: "registry:ui" },
    { path: "src/components/ui/code.tsx", type: "registry:ui" },
    { path: "src/components/ui/prism-language-loaders.ts", type: "registry:ui" },
    {
      path: "src/components/ui/prism-language-reloaders.d.ts",
      type: "registry:file",
      target: "src/components/ui/prism-language-reloaders.d.ts",
    },
    {
      path: "src/components/ui/prism-language-reloaders.js",
      type: "registry:file",
      target: "src/components/ui/prism-language-reloaders.js",
    },
    { path: "src/components/ui/prism-plugin.d.ts", type: "registry:ui" },
    { path: "src/components/ui/prism.ts", type: "registry:ui" },
  ]);
});

test("ships the Sentry source terms with the Code registry item", async () => {
  const notice = await readFile("THIRD_PARTY_NOTICES.md", "utf8");

  assert.match(
    notice,
    /Copyright 2008-2024 Functional Software, Inc\. dba Sentry/
  );
  assert.match(
    notice,
    /Functional Source License, Version 1\.1, Apache 2\.0 Future License/
  );
  assert.match(
    notice,
    /https:\/\/github\.com\/getsentry\/sentry\/blob\/d91f823d232ddd12a4d2a64554d85fd36df0e278\/LICENSE\.md/
  );
  assert.match(notice, /static\/app\/icons\/iconCopy\.tsx/);

  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), "scrapscn-code-notice-")
  );
  try {
    execFileSync(
      "pnpm",
      ["exec", "shadcn", "build", "registry.json", "--output", temporaryDirectory],
      { cwd: process.cwd(), stdio: "pipe" }
    );
    const builtItem = JSON.parse(
      await readFile(path.join(temporaryDirectory, "code.json"), "utf8")
    );
    const builtNotice = builtItem.files.find(
      ({ target }) => target === "src/components/ui/SENTRY_SOURCE_NOTICE.md"
    );

    assert.equal(builtNotice?.content, notice);
  } finally {
    await rm(temporaryDirectory, { recursive: true });
  }
});

test("regenerates the explicit Prism language loader map without drift", async () => {
  const temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), "scrapscn-prism-loaders-")
  );
  const outputPath = path.join(temporaryDirectory, "prism-language-loaders.ts");
  const reloaderOutputPath = path.join(
    temporaryDirectory,
    "prism-language-reloaders.js"
  );
  const reloaderTypesOutputPath = path.join(
    temporaryDirectory,
    "prism-language-reloaders.d.ts"
  );

  try {
    execFileSync(process.execPath, ["scripts/generate-prism-loaders.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PRISM_LOADERS_OUTPUT: outputPath,
        PRISM_RELOADERS_OUTPUT: reloaderOutputPath,
        PRISM_RELOADERS_TYPES_OUTPUT: reloaderTypesOutputPath,
      },
    });
    assert.equal(
      await readFile(outputPath, "utf8"),
      await readFile("src/components/ui/prism-language-loaders.ts", "utf8")
    );
    assert.equal(
      await readFile(reloaderOutputPath, "utf8"),
      await readFile("src/components/ui/prism-language-reloaders.js", "utf8")
    );
    assert.equal(
      await readFile(reloaderTypesOutputPath, "utf8"),
      await readFile("src/components/ui/prism-language-reloaders.d.ts", "utf8")
    );
    const prismLicense = (
      await readFile("node_modules/prismjs/LICENSE", "utf8")
    ).trim();
    const reloaderSource = await readFile(reloaderOutputPath, "utf8");
    assert.ok(reloaderSource.startsWith(`/*!\n${prismLicense}\n*/\n`));
    assert.doesNotMatch(reloaderSource, /https?:\/\//);
    const sourceFile = ts.createSourceFile(
      "prism-language-reloaders.js",
      reloaderSource,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.JS
    );
    const dynamicCodeCalls = [];
    function findDynamicCodeCalls(node) {
      if (
        (ts.isCallExpression(node) || ts.isNewExpression(node)) &&
        ts.isIdentifier(node.expression) &&
        (node.expression.text === "eval" || node.expression.text === "Function")
      ) {
        dynamicCodeCalls.push(node.expression.text);
      }
      ts.forEachChild(node, findDynamicCodeCalls);
    }
    findDynamicCodeCalls(sourceFile);
    assert.deepEqual(dynamicCodeCalls, []);
  } finally {
    await rm(temporaryDirectory, { recursive: true });
  }
});

test("compiles the built registry Prism files in an allowJs consumer", async () => {
  const temporaryDirectory = await mkdtemp(
    path.join(process.cwd(), ".scrapscn-code-consumer-")
  );
  const registryOutput = path.join(temporaryDirectory, "registry");
  const consumerSource = path.join(temporaryDirectory, "src", "components", "ui");

  try {
    execFileSync(
      "pnpm",
      ["exec", "shadcn", "build", "registry.json", "--output", registryOutput],
      { cwd: process.cwd(), stdio: "pipe" }
    );
    const code = JSON.parse(
      await readFile(path.join(registryOutput, "code.json"), "utf8")
    );
    const prismFiles = code.files.filter(({ path: filePath }) =>
      path.basename(filePath).startsWith("prism")
    );
    await mkdir(consumerSource, { recursive: true });
    await Promise.all(
      prismFiles.map(({ content, path: filePath, target }) =>
        writeFile(
          path.join(temporaryDirectory, target ?? filePath),
          content,
          "utf8"
        )
      )
    );
    await writeFile(
      path.join(temporaryDirectory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          allowJs: true,
          esModuleInterop: true,
          module: "esnext",
          moduleResolution: "bundler",
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: "es2022",
        },
        include: ["src/**/*"],
      }),
      "utf8"
    );

    execFileSync(
      "pnpm",
      ["exec", "tsc", "--project", path.join(temporaryDirectory, "tsconfig.json")],
      { cwd: process.cwd(), stdio: "pipe" }
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true });
  }
});

test("keeps the exact Code theme and interaction contract", async () => {
  const source = `${await readFile("src/components/ui/code.tsx", "utf8")}\n${await readFile("src/components/ui/code-block.tsx", "utf8")}`;
  const messages = await readFile("src/components/ui/code-messages.tsx", "utf8");
  const styles = await readFile("src/components/ui/code.module.css", "utf8");
  const serverEvidence = await readFile(
    "src/app/evidence/code-server/page.tsx",
    "utf8"
  );

  assert.match(source, /variant = "accent"/);
  assert.match(source, /useCodeMessages/);
  assert.doesNotMatch(source, /"Copy snippet"|"Copied"|"Unable to copy"/);
  assert.match(messages, /copyButtonLabel: "Copy snippet"/);
  assert.match(messages, /copiedTooltip: "Copied"/);
  assert.match(messages, /copyErrorTooltip: "Unable to copy"/);
  assert.match(messages, /copyTooltip: "Copy"/);
  assert.match(source, /isRounded = true/);
  assert.match(source, /navigator\.clipboard/);
  assert.match(source, /serializeStyles/);
  assert.match(source, /props\?: InlineCodeProps/);
  assert.match(source, /collisionPadding=\{12\}/);
  assert.match(source, /arrowPadding=\{4\}/);
  assert.match(source, /fallbackAxisSide: "none"/);
  assert.match(source, /onCopy\?\.\(copiedCode\)/);
  assert.match(source, /Prism\.highlightElement/);
  assert.match(
    source,
    /M1 4\.75C1 3\.78 1\.78 3 2\.75 3L4 3L4 1\.75/
  );
  assert.match(styles, /font-size-adjust: ex-height 0\.57/);
  assert.match(styles, /--scraps-code-tooltip-arrow-background: #2e2936/);
  assert.match(styles, /\.inlineCode \{\s+margin: 0;\s+padding: 0;/);
  assert.match(styles, /@fontsource\/roboto-mono\/400\.css/);
  assert.match(styles, /@fontsource\/roboto-mono\/500\.css/);
  assert.match(styles, /@fontsource\/rubik\/400\.css/);
  assert.match(styles, /var\(--font-roboto-mono, "Roboto Mono"\)/);
  assert.match(styles, /--scraps-theme-border-primary: #141119/);
  assert.match(styles, /border-radius: clamp\(0\.21em, 0\.28em, 0\.57em\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(hover: none\), \(pointer: coarse\)/);
  assert.match(styles, /min-width: 44px/);
  assert.match(styles, /background: var\(--scraps-code-button-hover\)/);
  assert.match(styles, /background: var\(--scraps-code-button-active\)/);
  assert.match(styles, /width: 28px/);
  assert.match(styles, /height: 28px/);
  assert.match(styles, /border-radius: 5px/);
  assert.match(
    styles,
    /0 0 0 0 var\(--scraps-code-focus-mask\),\s+0 0 0 2px var\(--scraps-code-focus\)/
  );
  assert.match(styles, /z-index: 10003/);
  assert.match(styles, /width: 16px/);
  assert.match(styles, /height: 8px/);
  assert.match(
    styles,
    /copy-tooltip-spring-enter 200ms\s+linear\(0, 0\.5901, 0\.9995, 1\.0411, 1\.0102, 0\.9984, 1\) both/
  );
  assert.match(
    styles,
    /copy-tooltip-spring-exit 200ms\s+linear\(0, 0\.5901, 0\.9995, 1\.0411, 1\.0102, 0\.9984, 1\) 100ms both/
  );
  assert.match(styles, /@keyframes copy-tooltip-spring-enter/);
  assert.match(styles, /@keyframes copy-tooltip-spring-exit/);
  assert.match(source, /height="12"/);
  assert.match(source, /points="-2,0 16,0 8,5\.8 6,5\.8"/);
  assert.match(source, /mayBeAnimatingOut/);
  assert.match(source, /const removedOpenMember = openTooltipGroupMembers\.delete/);
  assert.match(source, /const tooltipOpenDelay = 400/);
  assert.match(source, /const tooltipCloseDelay = 150/);
  assert.doesNotMatch(source, /setIsTooltipGroupWarm/);
  assert.match(source, /timeout=\{tooltipGroupTimeout\}/);
  assert.match(source, /event\.stopPropagation\(\)/);
  assert.match(source, /TooltipPrimitive\.Portal/);
  assert.match(source, /TooltipPrimitive\.Positioner/);
  assert.match(source, /TooltipPrimitive\.Arrow/);
  assert.doesNotMatch(serverEvidence, /["']use client["']/);
  assert.match(serverEvidence, /inlineCodeStyles\(/);
});
