import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import {
  CANONICAL_COMMIT,
  collectExcludedContractInputClosure,
  collectPinnedExcludedContractInputClosure,
  excludedContractInputDescriptors,
} from "../../scripts/parity-contract-inputs.mjs";

const descriptor = {
  id: "tooltip.overlayStyle.serializedStyles",
  canonicalSymbol: "TooltipProps.overlayStyle",
  excludedInput: "SerializedStyles",
  localInput: "CSSProperties",
  canonicalEvidencePaths: ["static/app/components/core/tooltip/tooltip.ts"],
  migrationRequirement: "Test fixture",
};

const directReferenceDescriptor = {
  id: "modal.modalCss.interpolation",
  canonicalSymbol: "ModalOptions.modalCss",
  excludedInput: "Interpolation<Theme>",
  targetKind: "direct-aliased-reference",
  localInput: "Tailwind class string",
  canonicalEvidencePaths: ["static/app/components/core/modal/modal.ts"],
  migrationRequirement: "Test fixture",
};

const renderAliasDescriptor = {
  id: "layout.renderFunction.arbitraryCssProperties",
  canonicalSymbol: "ContainerPropsWithRenderFunction",
  excludedInput: "React.CSSProperties",
  targetKind: "generic-alias-indexed-access-members",
  localInput: "Finite render-function fields only",
  canonicalEvidencePaths: ["static/app/components/core/layout/layout.ts"],
  migrationRequirement: "Test fixture",
};

const exportedAliasDescriptor = {
  id: "select.stylesConfig.arbitraryNestedSelectors",
  canonicalSymbol: "StylesConfig",
  excludedInput: "Open-ended nested CSS selectors",
  targetKind: "exported-alias",
  localInput: "Flat declarations or replacement components",
  canonicalEvidencePaths: ["static/app/components/core/select/select.ts"],
  migrationRequirement: "Test fixture",
};

async function writeModule(rootDirectory, moduleName, source) {
  const directory = path.join(rootDirectory, "static/app/components/core", moduleName);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "index.ts"), source);
}

async function writeRenderAliasFixture(
  rootDirectory,
  { indexedMembers = true, omitIndexedMember = false } = {},
) {
  await writeFile(
    path.join(rootDirectory, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: { module: "ESNext", moduleResolution: "Bundler", strict: true },
    }),
  );
  await writeModule(rootDirectory, "layout", `export * from './layout';`);
  await writeFile(
    path.join(rootDirectory, "static/app/components/core/layout/react.ts"),
    `
      export interface CSSProperties {
        inset?: string;
        width?: string | number;
      }
    `,
  );
  await writeFile(
    path.join(rootDirectory, "static/app/components/core/layout/layout.ts"),
    `
      import type * as React from './react';
      type Responsive<T> = T | {zero?: T};
      interface ContainerLayoutProps {
        containerType?: 'normal' | 'inline-size';
        gap?: Responsive<'sm' | 'md'>;
        ${
          indexedMembers
            ? `inset?: Responsive<React.CSSProperties['inset']>;
        width?: Responsive<React.CSSProperties['width']>;`
            : `inset?: Responsive<string>;
        width?: Responsive<string | number>;`
        }
      }
      export type ContainerProps<T extends string = 'div'> = ContainerLayoutProps & {
        as?: T;
      };
      export type ContainerPropsWithRenderFunction<T extends string = 'div'> = Omit<
        ContainerLayoutProps,
        'containerType'${omitIndexedMember ? ` | 'width'` : ""}
      > & {
        as?: never;
        children: (props: {className: string}) => unknown;
        element?: T;
      };
      export declare function Container<T extends string = 'div'>(
        props: ContainerProps<T> | ContainerPropsWithRenderFunction<T>
      ): null;
    `,
  );
}

test("collects public input paths through TypeScript component relations", async () => {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "parity-contract-inputs-"));
  try {
    await writeFile(
      path.join(rootDirectory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { module: "ESNext", moduleResolution: "Bundler", strict: true },
      }),
    );
    await writeModule(rootDirectory, "tooltip", `export * from './tooltip';`);
    await writeFile(
      path.join(rootDirectory, "static/app/components/core/tooltip/tooltip.ts"),
      `
        export type SerializedStyles = {readonly serialized: true};
        export type CSSProperties = {color?: string};
        export interface TooltipProps {
          overlayStyle?: CSSProperties | SerializedStyles;
          position?: 'top' | 'bottom';
          title: string;
        }
        export declare function Tooltip(props: TooltipProps): null;
      `,
    );
    await writeModule(
      rootDirectory,
      "direct",
      `
        import type {TooltipProps} from '../tooltip/index';
        export interface DirectProps extends Partial<Omit<TooltipProps, 'title'>> {}
      `,
    );
    await writeModule(
      rootDirectory,
      "generic",
      `
        import type {TooltipProps} from '../tooltip/index';
        interface Value extends Omit<TooltipProps, 'title'> {value: string}
        export declare function Generic<T extends Value = Value>(props: T): null;
      `,
    );
    await writeModule(
      rootDirectory,
      "genericDefault",
      `
        import type {TooltipProps} from '../tooltip/index';
        interface Value extends Omit<TooltipProps, 'title'> {value: string}
        export declare function GenericDefault<T extends {value: string} = Value>(props: T): null;
      `,
    );
    await writeModule(
      rootDirectory,
      "memo",
      `
        import type {TooltipProps} from '../tooltip/index';
        type Props = {tooltipOptions?: Omit<TooltipProps, 'title'>};
        type MemoExotic<P> = {displayName?: string; (props: P): null};
        export declare const Memoed: MemoExotic<Props>;
      `,
    );
    await writeModule(
      rootDirectory,
      "compound",
      `
        import type {TooltipProps} from '../tooltip/index';
        type ItemProps = {tooltipOptions?: Omit<TooltipProps, 'title'>};
        export declare function Compound(props: {value: string}): null;
        export declare namespace Compound { function Item(props: ItemProps): null; }
      `,
    );
    await writeModule(
      rootDirectory,
      "element",
      `
        import type {TooltipProps} from '../tooltip/index';
        interface ReactElement<P> {props: P}
        interface ButtonProps {tooltipProps?: Omit<TooltipProps, 'title'>}
        export type Action = {element: ReactElement<ButtonProps>};
      `,
    );
    await writeModule(
      rootDirectory,
      "hook",
      `
        import type {TooltipProps} from '../tooltip/index';
        interface ButtonProps {tooltipProps?: Omit<TooltipProps, 'title'>}
        export declare function useBound(): {SubmitButton(props: ButtonProps): null};
      `,
    );
    await writeModule(
      rootDirectory,
      "renderProp",
      `
        import type {TooltipProps} from '../tooltip/index';
        interface ButtonProps {tooltipProps?: Omit<TooltipProps, 'title'>}
        export declare function RenderProp(props: {children(bound: {Button(props: ButtonProps): null}): null}): null;
      `,
    );
    await writeModule(
      rootDirectory,
      "negative",
      `
        import type {TooltipProps} from '../tooltip/index';
        export type PositionOnly = Pick<TooltipProps, 'position'>;
        declare function InternalOnly(props: TooltipProps): null;
        export declare const Unresolved: any;
      `,
    );

    const moduleNames = [
      "compound",
      "direct",
      "element",
      "generic",
      "genericDefault",
      "hook",
      "memo",
      "negative",
      "renderProp",
      "tooltip",
    ];
    const [result] = collectExcludedContractInputClosure({
      rootDirectory,
      moduleNames,
      descriptors: [descriptor],
    });
    assert.deepEqual(result.affectedModules, [
      "compound",
      "direct",
      "element",
      "generic",
      "genericDefault",
      "hook",
      "memo",
      "renderProp",
      "tooltip",
    ]);
    assert.ok(result.evidence.every((item) => item.trace.includes(".overlayStyle")));
  } finally {
    await rm(rootDirectory, { recursive: true, force: true });
  }
});

test("rejects unresolved public contract dependencies", async () => {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "parity-contract-unresolved-"));
  try {
    await writeFile(
      path.join(rootDirectory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { module: "ESNext", moduleResolution: "Bundler", strict: true },
      }),
    );
    await writeModule(rootDirectory, "tooltip", `export * from './tooltip';`);
    await writeFile(
      path.join(rootDirectory, "static/app/components/core/tooltip/tooltip.ts"),
      `
        import type {SerializedStyles} from 'missing-contract-dependency';
        export type CSSProperties = {color?: string};
        export interface TooltipProps {
          overlayStyle?: CSSProperties | SerializedStyles;
          title: string;
        }
        export declare function Tooltip(props: TooltipProps): null;
      `,
    );

    assert.throws(
      () =>
        collectExcludedContractInputClosure({
          rootDirectory,
          moduleNames: ["tooltip"],
          descriptors: [descriptor],
        }),
      /TypeScript contract diagnostics differ from the pinned baseline/,
    );
  } finally {
    await rm(rootDirectory, { recursive: true, force: true });
  }
});

test("collects a direct aliased public contract input", async () => {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "parity-contract-direct-"));
  try {
    await writeFile(
      path.join(rootDirectory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { module: "ESNext", moduleResolution: "Bundler", strict: true },
      }),
    );
    await writeModule(rootDirectory, "modal", `export * from './modal';`);
    await writeFile(
      path.join(rootDirectory, "static/app/components/core/modal/modal.ts"),
      `
        export type Theme = {readonly name: string};
        export type Interpolation<T> = {readonly theme?: T};
        export type ModalOptions = {modalCss?: Interpolation<Theme>};
        export type ModalTypes = {options: ModalOptions};
      `,
    );
    await writeModule(
      rootDirectory,
      "negative",
      `
        import type {ModalOptions} from '../modal/index';
        export type NoCss = Pick<ModalOptions, never>;
      `,
    );

    const [result] = collectExcludedContractInputClosure({
      rootDirectory,
      moduleNames: ["modal", "negative"],
      descriptors: [directReferenceDescriptor],
    });
    assert.deepEqual(result.affectedModules, ["modal"]);
    assert.match(result.evidence[0].trace, /\.modalCss/);
  } finally {
    await rm(rootDirectory, { recursive: true, force: true });
  }
});

test("collects an exported alias used by a public component contract", async () => {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "parity-contract-exported-alias-"));
  try {
    await writeFile(
      path.join(rootDirectory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: { module: "ESNext", moduleResolution: "Bundler", strict: true },
      }),
    );
    await writeModule(rootDirectory, "select", `export * from './select';`);
    await writeFile(
      path.join(rootDirectory, "static/app/components/core/select/select.ts"),
      `
        export type StylesConfig = {option?: Record<string, unknown>};
        export interface SelectProps {styles?: StylesConfig}
        export declare function Select(props: SelectProps): null;
      `,
    );
    await writeModule(
      rootDirectory,
      "form",
      `
        import type {StylesConfig} from '../select/index';
        export interface SelectFieldProps {styles?: StylesConfig}
      `,
    );
    await writeModule(rootDirectory, "negative", `export type StylesConfig = {color: string};`);

    const [result] = collectExcludedContractInputClosure({
      rootDirectory,
      moduleNames: ["form", "negative", "select"],
      descriptors: [exportedAliasDescriptor],
    });
    assert.deepEqual(result.affectedModules, ["form", "select"]);
    assert.deepEqual(
      result.evidence.map(({ moduleName }) => moduleName),
      ["form", "select"],
    );
  } finally {
    await rm(rootDirectory, { recursive: true, force: true });
  }
});

test("collects the CSSProperties-backed public render alias through semantic identities", async () => {
  const rootDirectory = await mkdtemp(path.join(tmpdir(), "parity-contract-render-alias-"));
  try {
    await writeRenderAliasFixture(rootDirectory);
    await writeModule(
      rootDirectory,
      "direct",
      `export {type ContainerPropsWithRenderFunction as DirectRender} from '../layout/index';`,
    );
    await writeModule(
      rootDirectory,
      "embedded",
      `
        import type {ContainerPropsWithRenderFunction} from '../layout/index';
        export type EmbeddedRender = {render?: ContainerPropsWithRenderFunction};
      `,
    );
    await writeModule(
      rootDirectory,
      "reexport",
      `export {type ContainerPropsWithRenderFunction} from '../layout/index';`,
    );
    await writeModule(
      rootDirectory,
      "ordinaryOnly",
      `
        import type {ContainerProps} from '../layout/index';
        export declare function Ordinary(props: ContainerProps): null;
      `,
    );
    await writeModule(
      rootDirectory,
      "finiteOnly",
      `
        import type {ContainerPropsWithRenderFunction} from '../layout/index';
        export type FiniteOnly = Pick<ContainerPropsWithRenderFunction, 'gap'>;
      `,
    );
    await writeModule(
      rootDirectory,
      "sameName",
      `
        export type ContainerPropsWithRenderFunction<T = string> = {
          finite?: T;
        };
      `,
    );

    const [result] = collectExcludedContractInputClosure({
      rootDirectory,
      moduleNames: [
        "direct",
        "embedded",
        "finiteOnly",
        "layout",
        "ordinaryOnly",
        "reexport",
        "sameName",
      ],
      descriptors: [renderAliasDescriptor],
    });
    assert.deepEqual(result.affectedModules, ["direct", "embedded", "layout", "reexport"]);
    assert.deepEqual(
      result.evidence.map(({ exportName }) => exportName),
      [
        "DirectRender",
        "EmbeddedRender",
        "ContainerPropsWithRenderFunction",
        "ContainerPropsWithRenderFunction",
      ],
    );
    assert.ok(result.evidence.every((item) => item.trace.startsWith(`${item.moduleName}.`)));
    assert.equal(result.affectedModules.includes("ordinaryOnly"), false);
    assert.equal(result.affectedModules.includes("finiteOnly"), false);
    assert.equal(result.affectedModules.includes("sameName"), false);
  } finally {
    await rm(rootDirectory, { recursive: true, force: true });
  }
});

test("rejects a render alias with no React.CSSProperties indexed member", async () => {
  const rootDirectory = await mkdtemp(
    path.join(tmpdir(), "parity-contract-render-alias-negative-"),
  );
  try {
    await writeRenderAliasFixture(rootDirectory, { indexedMembers: false });
    assert.throws(
      () =>
        collectExcludedContractInputClosure({
          rootDirectory,
          moduleNames: ["layout"],
          descriptors: [renderAliasDescriptor],
        }),
      /Cannot find React\.CSSProperties indexed members in ContainerPropsWithRenderFunction/,
    );
  } finally {
    await rm(rootDirectory, { recursive: true, force: true });
  }
});

test("rejects a render alias that drops a CSSProperties indexed member", async () => {
  const rootDirectory = await mkdtemp(
    path.join(tmpdir(), "parity-contract-render-member-negative-"),
  );
  try {
    await writeRenderAliasFixture(rootDirectory, { omitIndexedMember: true });
    assert.throws(
      () =>
        collectExcludedContractInputClosure({
          rootDirectory,
          moduleNames: ["layout"],
          descriptors: [renderAliasDescriptor],
        }),
      /does not retain every React\.CSSProperties indexed member/,
    );
  } finally {
    await rm(rootDirectory, { recursive: true, force: true });
  }
});

const expectedPinnedClosure = [
  "alert",
  "avatar",
  "avatarButton",
  "badge",
  "breadcrumbList",
  "button",
  "compactSelect",
  "form",
  "menuListItem",
  "modal",
  "segmentedControl",
  "select",
  "tabs",
  "tooltip",
];
const expectedPinnedModalClosure = ["modal"];
const expectedPinnedTooltipEvidenceHash =
  "14cb9089ac23c990c3cc82e4a70001424c5c63c0ad50b0ab8fdba339a3288983";
const expectedPinnedModalEvidenceHash =
  "2015ad7465e813c79227b95e8d7eb5a19ce856a3d23904f763e551378fba5217";
const canonicalRepository = path.resolve(process.env.SENTRY_REPO_PATH ?? "../sentry");
const dependencyRepository = path.resolve(
  process.env.SENTRY_DEPENDENCY_REPO_PATH ?? canonicalRepository,
);
const moduleNames = execFileSync(
  "git",
  ["ls-tree", "--name-only", "-d", `${CANONICAL_COMMIT}:static/app/components/core`],
  { cwd: canonicalRepository, encoding: "utf8" },
)
  .trim()
  .split("\n")
  .filter((name) => name && !["overview", "patterns", "principles"].includes(name))
  .sort();
let pinnedClosurePromise;

function pinnedClosure() {
  pinnedClosurePromise ??= collectPinnedExcludedContractInputClosure({
    canonicalRepository,
    dependencyRepository,
    moduleNames,
  });
  return pinnedClosurePromise;
}

function evidenceHash(evidence) {
  return createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
}

test("derives the exact excluded-input closure from the pinned canonical commit", async () => {
  const [tooltip, modal, layout, selectStyles] = await pinnedClosure();
  assert.deepEqual(tooltip.affectedModules, expectedPinnedClosure);
  assert.deepEqual(modal.affectedModules, expectedPinnedModalClosure);
  assert.deepEqual(layout.affectedModules, ["layout"]);
  assert.equal(evidenceHash(tooltip.evidence), expectedPinnedTooltipEvidenceHash);
  assert.equal(evidenceHash(modal.evidence), expectedPinnedModalEvidenceHash);
  assert.deepEqual(layout.evidence, [
    {
      moduleName: "layout",
      exportName: "ContainerPropsWithRenderFunction",
      trace: "layout.ContainerPropsWithRenderFunction",
    },
  ]);
  assert.deepEqual(selectStyles.affectedModules, ["select"]);
  assert.deepEqual(selectStyles.evidence, [
    {
      moduleName: "select",
      exportName: "StylesConfig",
      trace: "select.StylesConfig",
    },
  ]);
});

test("keeps the pinned closure complement unaffected", async () => {
  const [tooltip, modal, layout, selectStyles] = await pinnedClosure();
  const affected = new Set(tooltip.affectedModules);
  assert.deepEqual(
    moduleNames.filter((moduleName) => affected.has(moduleName)),
    expectedPinnedClosure,
  );
  assert.ok(moduleNames.filter((moduleName) => !affected.has(moduleName)).includes("info"));
  assert.equal(affected.has("info"), false);
  assert.deepEqual(
    moduleNames.filter((moduleName) => modal.affectedModules.includes(moduleName)),
    expectedPinnedModalClosure,
  );
  assert.deepEqual(
    moduleNames.filter((moduleName) => layout.affectedModules.includes(moduleName)),
    ["layout"],
  );
  assert.deepEqual(
    moduleNames.filter((moduleName) => selectStyles.affectedModules.includes(moduleName)),
    ["select"],
  );
});

test("uses an explicit dependency checkout and removes temporary worktrees", async () => {
  assert.doesNotMatch(
    await readFile("scripts/parity-contract-inputs.mjs", "utf8"),
    /worktree["'],\s*["']prune/,
  );
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), "parity-contract-dependencies-"));
  const sourceRepository = path.join(temporaryDirectory, "sentry");
  try {
    execFileSync(
      "git",
      ["clone", "--quiet", "--shared", "--no-checkout", canonicalRepository, sourceRepository],
      { stdio: "ignore" },
    );

    const [layout] = await collectPinnedExcludedContractInputClosure({
      canonicalRepository: sourceRepository,
      dependencyRepository,
      moduleNames,
      descriptors: [excludedContractInputDescriptors[2]],
    });
    assert.deepEqual(layout.affectedModules, ["layout"]);
    assert.equal(
      execFileSync("git", ["-C", sourceRepository, "worktree", "list", "--porcelain"], {
        encoding: "utf8",
      }).match(/^worktree /gm)?.length,
      1,
    );

    await assert.rejects(
      collectPinnedExcludedContractInputClosure({
        canonicalRepository: sourceRepository,
        dependencyRepository: sourceRepository,
        moduleNames,
      }),
      /Missing dependency node_modules/,
    );
    await mkdir(path.join(sourceRepository, "node_modules", ".pnpm"), { recursive: true });
    await writeFile(path.join(sourceRepository, "node_modules", ".pnpm", "lock.yaml"), "stale\n");
    await assert.rejects(
      collectPinnedExcludedContractInputClosure({
        canonicalRepository: sourceRepository,
        dependencyRepository: sourceRepository,
        moduleNames,
      }),
      /Canonical TypeScript contract diagnostics differ from the pinned baseline/,
    );
    assert.equal(
      execFileSync("git", ["-C", sourceRepository, "worktree", "list", "--porcelain"], {
        encoding: "utf8",
      }).match(/^worktree /gm)?.length,
      1,
    );
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
