import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const canonicalCommit = "a2db8365e2ec17c96b200bface596081c68f12c9";
const sentryRepository = path.resolve(process.cwd(), process.env.SENTRY_REPO_PATH ?? "../sentry");
const completionNote =
  "Exact regular Scraps Chat exports, message geometry, feedback and copy behavior, ToolCall details and references, tool status semantics, spinner motion, live and completed thinking behavior, canonical icons, workbench, production browser behavior, and standalone registry delivery use literal Tailwind classes and static global keyframes. The canonical module has no Figma node or Code Connect source.";

test("records the complete regular Scraps Chat clone", async () => {
  const manifest = JSON.parse(await readFile("scraps-parity.json", "utf8"));
  const item = manifest.modules.find(({ name }) => name === "chat");
  assert.deepEqual(item.canonical.publicExports, {
    runtime: [
      "AssistantActions",
      "AssistantMessage",
      "MessageRow",
      "Spinner",
      "ThinkingBlock",
      "ToolCall",
      "ToolCallIndicator",
      "UserMessage",
    ],
    types: ["ToolCallReference", "ToolCallStatus"],
  });
  assert.deepEqual(item.local.implementationPaths, ["src/components/ui/chat.tsx"]);
  assert.deepEqual(item.local.implementedExports, item.canonical.publicExports);
  assert.deepEqual(item.local.registryItems, ["chat"]);
  assert.deepEqual(item.local.codeConnect, []);
  assert.deepEqual(item.local.figmaNodes, []);
  assert.equal(item.local.playgroundPath, "/?component=chat");
  assert.deepEqual(item.completion, {
    complete: true,
    note: completionNote,
    state: "complete",
  });
  for (const evidence of [
    "static/app/components/core/chat/thinkingBlock.spec.tsx",
    "static/app/components/core/markdown/useStreamingAnimation.ts",
    "static/app/components/copyToClipboardButton.tsx",
    "static/app/icons/iconSeer.tsx",
    "static/app/utils/duration/getDuration.tsx",
  ]) {
    assert.ok(item.canonical.sourcePaths.includes(evidence), evidence);
  }
});

test("records no invented Chat Figma mapping", () => {
  const canonicalPaths = execFileSync(
    "git",
    ["ls-tree", "-r", "--name-only", canonicalCommit, "--", "static/app/components/core/chat"],
    { cwd: sentryRepository, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .filter(Boolean);
  assert.deepEqual(
    canonicalPaths.filter((sourcePath) => /\.figma\.tsx?$/.test(sourcePath)),
    [],
  );
  for (const sourcePath of canonicalPaths.filter((path) => path.endsWith(".mdx"))) {
    const source = execFileSync("git", ["show", `${canonicalCommit}:${sourcePath}`], {
      cwd: sentryRepository,
      encoding: "utf8",
    });
    assert.doesNotMatch(source, /figma\.com/i, sourcePath);
  }
});

test("keeps the canonical Chat contract in Tailwind without CSS-in-JS", async () => {
  const source = await readFile("src/components/ui/chat.tsx", "utf8");
  const styles = await readFile("src/components/ui/chat.css", "utf8");
  const decodeStyles = await readFile("src/components/ui/markdown.css", "utf8");
  for (const fragment of [
    'maxWidth = "80%"',
    "bg-[var(--scraps-theme-surface400)]",
    "wrap-anywhere whitespace-pre-wrap",
    'density = "default"',
    'from === "user" ? "justify-end" : "justify-start"',
    'density === "default" ? "p-4" : "px-4 py-2"',
    'size = "xs"',
    'feedback="positive"',
    'feedback="negative"',
    "event.stopPropagation()",
    "navigator.clipboard.writeText(copyText)",
    "onCopy?.(copyText)",
    "onFeedback?.(feedback)",
    "copyText ? (",
    "function ToolCallReferenceChip",
    "function ToolCallFailureChip",
    "function ToolCallInput",
    "function ToolCallOutput",
    "function getToolCallStatusLabel",
    'aria-hidden={!props["aria-label"] && !props.role ? true : undefined}',
    "motion-reduce:animate-[scraps-chat-spin_2.4s_linear_infinite]",
    '| "content"',
    'return <Spinner aria-label={label} role="status" />',
    'if (status === "content") return null',
    "durationMs?: number",
    "failureLabel?: string",
    "input?: ReactNode",
    "output?: ReactNode",
    'const isFailure = status === "failure"',
    "{formatElapsed(durationMs)}",
    "<ToolCallInput input={input} />",
    "<ToolCallOutput output={output} />",
    "minWidth={0}",
    'title.replace(/[.…\\s]+$/u, "")',
    "expanded={isActive || userExpanded}",
    'useTextDecodeAnimation } from "./markdown-streaming"',
    "M8 0.25C8.21",
    "M8.38 0C9.55",
    "M13.72 3.22",
    "M6.81 0.65",
  ]) {
    assert.ok(source.includes(fragment), fragment);
  }
  for (const fragment of ["@keyframes scraps-chat-spin", "@keyframes scraps-chat-seer-wait"]) {
    assert.ok(styles.includes(fragment), fragment);
  }
  for (const fragment of [
    "@keyframes scraps-markdown-decode-accent",
    "[data-scraps-decode]::after",
  ]) {
    assert.ok(decodeStyles.includes(fragment), fragment);
  }
  assert.doesNotMatch(source, /@emotion|styled\(|css`|\.module\.css|CopyToClipboardButton|legacy/i);
});

test("publishes the standalone Chat registry closure", async () => {
  const registry = JSON.parse(await readFile("registry.json", "utf8"));
  const item = registry.items.find(({ name }) => name === "chat");
  assert.deepEqual(item.dependencies, ["framer-motion@12.38.0"]);
  assert.deepEqual(item.registryDependencies, [
    "https://scrapscn.sentry.dev/r/button.json",
    "https://scrapscn.sentry.dev/r/disclosure.json",
    "https://scrapscn.sentry.dev/r/markdown.json",
    "https://scrapscn.sentry.dev/r/scraps-locale.json",
    "https://scrapscn.sentry.dev/r/text.json",
  ]);
  assert.deepEqual(item.files, [
    {
      path: "src/components/ui/chat.css",
      type: "registry:file",
      target: "src/components/ui/chat.css",
    },
    { path: "src/components/ui/chat.tsx", type: "registry:ui" },
  ]);

  const directory = await mkdtemp(path.join(tmpdir(), "scrapscn-chat-"));
  try {
    execFileSync("pnpm", ["exec", "shadcn", "build", "registry.json", "--output", directory], {
      cwd: process.cwd(),
      stdio: "pipe",
    });
    const built = JSON.parse(await readFile(path.join(directory, "chat.json"), "utf8"));
    assert.equal(
      built.files.find(({ path: filePath }) => filePath.endsWith("chat.tsx"))?.content,
      await readFile("src/components/ui/chat.tsx", "utf8"),
    );
    assert.equal(
      built.files.find(({ path: filePath }) => filePath.endsWith("chat.css"))?.content,
      await readFile("src/components/ui/chat.css", "utf8"),
    );
    assert.deepEqual(JSON.parse(await readFile("public/r/chat.json", "utf8")), built);
    assert.deepEqual(
      JSON.parse(await readFile("public/r/registry.json", "utf8")),
      JSON.parse(await readFile(path.join(directory, "registry.json"), "utf8")),
    );
  } finally {
    await rm(directory, { recursive: true });
  }
});
