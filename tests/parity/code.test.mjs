import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import ts from "typescript";

test("completes the Code consumer contract and excludes only the CSS-in-JS helper", async () => {
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
  assert.deepEqual(code.canonical.excludedExports, {
    runtime: ["inlineCodeStyles"],
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
  assert.equal(code.completion.state, "complete");
  assert.match(
    code.completion.note,
    /inlineCodeStyles exclusion is an Emotion SerializedStyles factory/,
  );
});

test("publishes Code as a standalone registry item", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const code = registry.items.find(({ name }) => name === "code");

  assert.deepEqual(code.dependencies, [
    "@fontsource-variable/roboto-mono@5.2.9",
    "@types/prismjs@1.26.0",
    "prismjs@1.30.0",
  ]);
  assert.deepEqual(code.registryDependencies, ["https://scrapscn.sentry.dev/r/button.json"]);
  assert.equal(code.cssVars.light["scraps-code-focus-mask"], "#ffffff");
  assert.equal(code.cssVars.dark["scraps-code-focus-mask"], "#2e2936");
  assert.deepEqual(code.files, [
    {
      path: "THIRD_PARTY_NOTICES.md",
      type: "registry:file",
      target: "src/components/ui/SENTRY_SOURCE_NOTICE.md",
    },
    {
      path: "src/components/ui/roboto-mono.css",
      type: "registry:file",
      target: "src/components/ui/roboto-mono.css",
    },
    { path: "src/components/ui/code-block.tsx", type: "registry:ui" },
    { path: "src/components/ui/code-messages.tsx", type: "registry:ui" },
    { path: "src/components/ui/code.tsx", type: "registry:ui" },
    {
      path: "src/components/ui/prism-language-loaders.ts",
      type: "registry:ui",
    },
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

  assert.match(notice, /Copyright 2008-2024 Functional Software, Inc\. dba Sentry/);
  assert.match(notice, /Functional Source License, Version 1\.1, Apache 2\.0 Future License/);
  assert.match(
    notice,
    /https:\/\/github\.com\/getsentry\/sentry\/blob\/046a07857f36741bb60d070abe2191d08da76d24\/LICENSE\.md/,
  );
  assert.match(notice, /static\/app\/icons\/iconCopy\.tsx/);

  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "scrapscn-code-notice-"));
  try {
    execFileSync(
      "pnpm",
      ["exec", "shadcn", "build", "registry.json", "--output", temporaryDirectory],
      { cwd: process.cwd(), stdio: "pipe" },
    );
    const builtItem = JSON.parse(
      await readFile(path.join(temporaryDirectory, "code.json"), "utf8"),
    );
    const builtNotice = builtItem.files.find(
      ({ target }) => target === "src/components/ui/SENTRY_SOURCE_NOTICE.md",
    );
    const builtCodeBlock = builtItem.files.find(
      ({ path: filePath }) => filePath === "src/components/ui/code-block.tsx",
    );

    assert.equal(builtNotice?.content, notice);
    assert.equal(
      builtCodeBlock?.content,
      await readFile("src/components/ui/code-block.tsx", "utf8"),
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true });
  }
});

test("regenerates the explicit Prism language loader map without drift", async () => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "scrapscn-prism-loaders-"));
  const outputPath = path.join(temporaryDirectory, "prism-language-loaders.ts");
  const reloaderOutputPath = path.join(temporaryDirectory, "prism-language-reloaders.js");
  const reloaderTypesOutputPath = path.join(temporaryDirectory, "prism-language-reloaders.d.ts");

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
      await readFile("src/components/ui/prism-language-loaders.ts", "utf8"),
    );
    assert.equal(
      await readFile(reloaderOutputPath, "utf8"),
      await readFile("src/components/ui/prism-language-reloaders.js", "utf8"),
    );
    assert.equal(
      await readFile(reloaderTypesOutputPath, "utf8"),
      await readFile("src/components/ui/prism-language-reloaders.d.ts", "utf8"),
    );
    const prismLicense = (await readFile("node_modules/prismjs/LICENSE", "utf8")).trim();
    const reloaderSource = await readFile(reloaderOutputPath, "utf8");
    assert.ok(reloaderSource.startsWith(`/*!\n${prismLicense}\n*/\n`));
    assert.doesNotMatch(reloaderSource, /https?:\/\//);
    const sourceFile = ts.createSourceFile(
      "prism-language-reloaders.js",
      reloaderSource,
      ts.ScriptTarget.ESNext,
      true,
      ts.ScriptKind.JS,
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
  const temporaryDirectory = await mkdtemp(path.join(process.cwd(), ".scrapscn-code-consumer-"));
  const registryOutput = path.join(temporaryDirectory, "registry");
  const consumerSource = path.join(temporaryDirectory, "src", "components", "ui");

  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", registryOutput], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const code = JSON.parse(await readFile(path.join(registryOutput, "code.json"), "utf8"));
    const prismFiles = code.files.filter(({ path: filePath }) =>
      path.basename(filePath).startsWith("prism"),
    );
    await mkdir(consumerSource, { recursive: true });
    await Promise.all(
      prismFiles.map(({ content, path: filePath, target }) =>
        writeFile(path.join(temporaryDirectory, target ?? filePath), content, "utf8"),
      ),
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
      "utf8",
    );

    execFileSync(
      "pnpm",
      ["exec", "tsc", "--project", path.join(temporaryDirectory, "tsconfig.json")],
      { cwd: process.cwd(), stdio: "pipe" },
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true });
  }
});

test("keeps the exact Code theme and interaction contract", async () => {
  const source = `${await readFile(
    "src/components/ui/code.tsx",
    "utf8",
  )}\n${await readFile("src/components/ui/code-block.tsx", "utf8")}`;
  const messages = await readFile("src/components/ui/code-messages.tsx", "utf8");
  const tooltipSource = await readFile("src/components/ui/tooltip.tsx", "utf8");
  const fontStyles = await readFile("src/components/ui/roboto-mono.css", "utf8");
  const serverEvidence = await readFile("src/app/evidence/code-server/page.tsx", "utf8");

  assert.match(source, /variant = "accent"/);
  assert.match(source, /useCodeMessages/);
  assert.doesNotMatch(source, /"Copy snippet"|"Copied"|"Unable to copy"/);
  assert.match(messages, /copyButtonLabel: "Copy snippet"/);
  assert.match(messages, /copiedTooltip: "Copied"/);
  assert.match(messages, /copyErrorTooltip: "Unable to copy"/);
  assert.match(messages, /copyTooltip: "Copy"/);
  assert.match(source, /isRounded = true/);
  assert.match(source, /navigator\.clipboard/);
  assert.doesNotMatch(
    source,
    /@emotion|serializeStyles|inlineCodeStyles|\.module\.css|TooltipPrimitive/,
  );
  assert.match(source, /rounded-\[clamp\(0\.21em,0\.28em,0\.57em\)\]/);
  assert.match(source, /import \{ Button \} from "\.\/button"/);
  assert.match(source, /tooltipProps=\{\{/);
  assert.match(source, /position: "left"/);
  assert.match(tooltipSource, /collisionPadding=\{COLLISION_PADDING\}/);
  assert.match(source, /onCopy\?\.\(copiedCode\)/);
  assert.match(source, /Prism\.highlightElement/);
  assert.match(source, /M1 4\.75C1 3\.78 1\.78 3 2\.75 3L4 3L4 1\.75/);
  assert.match(source, /\[font-size-adjust:ex-height_0\.57\]/);
  assert.match(source, /\[--scraps-code-tooltip-arrow-background:#2e2936\]/);
  assert.match(fontStyles, /font-family: "Roboto Mono"/);
  assert.match(fontStyles, /font-weight: 425 600/);
  assert.match(
    fontStyles,
    /@fontsource-variable\/roboto-mono\/files\/roboto-mono-latin-wght-normal\.woff2/,
  );
  assert.match(source, /import "\.\/roboto-mono\.css"/);
  assert.match(
    source,
    /\[font-family:var\(--font-roboto-mono,'Roboto_Mono_Variable'\),'Roboto_Mono',monospace\]/,
  );
  assert.doesNotMatch(source, /font-mono/);
  assert.match(source, /\[--scraps-theme-border-primary:#141119\]/);
  assert.match(source, /rounded-\[clamp\(0\.21em,0\.28em,0\.57em\)\]/);
  assert.match(source, /motion-reduce:transition-none/);
  assert.match(source, /touch-manipulation/);
  assert.match(source, /\[@media\(hover:none\)\]:min-h-11/);
  assert.match(source, /\[@media\(pointer:coarse\)\]:min-w-11/);
  assert.match(source, /\[--scraps-button-transparent-hover:var\(--scraps-code-button-hover\)\]/);
  assert.match(source, /\[--scraps-button-transparent-active:var\(--scraps-code-button-active\)\]/);
  assert.match(source, /size="xs"/);
  assert.match(source, /variant="transparent"/);
  assert.match(source, /hasFloatingHeader \? floatingHeaderClasses : regularHeaderClasses/);
  assert.match(source, /selectedTab === value\s+\? selectedTabClasses\s+: unselectedTabClasses/);
  assert.match(source, /\[border-width:0_0_3px_0\]/);
  assert.match(source, /\[--prism-token-function:var\(--prism-function\)\]/);
  assert.match(
    source,
    /var\(--prism-token-variable,var\(--prism-token-function,var\(--prism-token-keyword/,
  );
  assert.match(source, /\[--background:var\(--scraps-code-focus-mask\)\]/);
  assert.match(source, /\[--ring:var\(--scraps-code-focus\)\]/);
  assert.match(source, /height="12"/);
  assert.doesNotMatch(source, /tooltipGroupListeners|tooltipOpenDelay|CopyTooltipArrow/);
  await assert.rejects(readFile("src/components/ui/code.module.css", "utf8"), {
    code: "ENOENT",
  });
  assert.doesNotMatch(serverEvidence, /["']use client["']/);
  assert.doesNotMatch(serverEvidence, /inlineCodeStyles|@emotion/);
});
