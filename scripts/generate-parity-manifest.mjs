import {access, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

import ts from 'typescript';

import {
  collectParityManifestExports,
  collectParityManifestFileExports,
} from './parity-manifest-exports.mjs';

const CANONICAL_COMMIT = 'd91f823d232ddd12a4d2a64554d85fd36df0e278';
const EXCLUDED_DIRECTORIES = ['overview', 'patterns', 'principles'];
const canonicalBehaviorDependencies = {
  backdrop: [
    'static/app/utils/theme/theme.tsx',
  ],
  code: [
    'static/app/components/core/button/button.tsx',
    'static/app/components/core/button/styles.tsx',
    'static/app/components/core/button/types.tsx',
    'static/app/components/core/button/useButtonFunctionality.tsx',
    'static/app/components/core/layout/container.tsx',
    'static/app/components/core/layout/index.tsx',
    'static/app/components/core/layout/styles.tsx',
    'static/app/components/core/tooltip/tooltip.tsx',
    'static/app/components/overlay.tsx',
    'static/app/components/overlayArrow.tsx',
    'static/app/icons/iconCopy.tsx',
    'static/app/icons/svgIcon.tsx',
    'static/app/icons/useIconDefaults.tsx',
    'static/app/locale.tsx',
    'static/app/styles/global.tsx',
    'static/app/utils/prism.tsx',
    'static/app/utils/theme/theme.tsx',
    'static/app/utils/theme/scraps/theme/base.tsx',
    'static/app/utils/theme/scraps/theme/dark.tsx',
    'static/app/utils/theme/scraps/theme/light.tsx',
    'static/app/utils/theme/scraps/tokens/color.tsx',
    'static/app/utils/theme/scraps/tokens/size.tsx',
    'static/app/utils/theme/scraps/tokens/typography.tsx',
    'static/app/utils/useHoverOverlay.tsx',
  ],
  quote: [
    'static/app/components/core/layout/container.tsx',
    'static/app/components/core/layout/flex.tsx',
    'static/app/components/core/layout/index.tsx',
    'static/app/components/core/layout/stack.tsx',
    'static/app/components/core/layout/styles.tsx',
    'static/app/components/core/quote/quote.mdx',
    'static/app/components/core/text/index.tsx',
    'static/app/components/core/text/styles.tsx',
    'static/app/components/core/text/text.tsx',
    'static/app/utils/theme/index.tsx',
    'static/app/utils/theme/scraps/theme/base.tsx',
    'static/app/utils/theme/scraps/theme/dark.tsx',
    'static/app/utils/theme/scraps/theme/light.tsx',
    'static/app/utils/theme/scraps/tokens/color.tsx',
    'static/app/utils/theme/scraps/tokens/size.tsx',
    'static/app/utils/theme/scraps/tokens/typography.tsx',
    'static/app/utils/theme/theme.tsx',
    'static/app/utils/theme/types.tsx',
  ],
  text: [
    'static/less/fonts.less',
    'static/app/components/core/hotkey/kbd.tsx',
    'static/app/components/core/layout/index.tsx',
    'static/app/components/core/layout/styles.tsx',
    'static/app/components/core/code/inlineCode.tsx',
    'static/app/components/core/text/styles.tsx',
    'static/app/utils/theme/scraps/theme/dark.tsx',
    'static/app/utils/theme/scraps/theme/light.tsx',
    'static/app/utils/theme/scraps/tokens/color.tsx',
    'static/app/utils/theme/scraps/tokens/size.tsx',
    'static/app/utils/theme/scraps/tokens/typography.tsx',
    'static/app/utils/theme/types.tsx',
  ],
  image: [
    'static/app/components/core/layout/styles.tsx',
    'static/app/utils/theme/scraps/theme/base.tsx',
    'static/app/utils/theme/scraps/tokens/size.tsx',
    'static/app/utils/theme/types.tsx',
  ],
  hotkey: [
    'static/app/components/core/hotkey/keyMappings.tsx',
    'static/app/icons/iconArrow.tsx',
    'static/app/icons/iconCommand.tsx',
    'static/app/icons/iconControl.tsx',
    'static/app/icons/iconOption.tsx',
    'static/app/icons/iconReturn.tsx',
    'static/app/icons/iconShift.tsx',
    'static/app/icons/svgIcon.tsx',
    'static/app/icons/useIconDefaults.tsx',
    'static/app/utils/array/toArray.tsx',
    'static/app/utils/string/toTitleCase.tsx',
    'static/app/utils/theme/scraps/theme/base.tsx',
    'static/app/utils/theme/scraps/theme/dark.tsx',
    'static/app/utils/theme/scraps/theme/light.tsx',
    'static/app/utils/theme/scraps/tokens/size.tsx',
    'static/app/utils/theme/scraps/tokens/color.tsx',
    'static/app/utils/theme/scraps/tokens/typography.tsx',
  ],
  revealOnHover: [
    'static/app/utils/theme/theme.tsx',
  ],
  slot: [
    'static/app/components/core/sizeContext.tsx',
    'static/app/components/core/slot/knownContexts.ts',
  ],
  splitPanel: [
    'static/app/utils/useDimensions.tsx',
    'static/app/utils/useResizableDrawer.tsx',
  ],
  table: [
    'static/app/components/tables/sortableHeaderCell.tsx',
    'static/app/components/tables/useColumnResize.tsx',
    'static/app/components/tables/useObservedColumnSize.tsx',
    'static/app/icons/iconArrow.tsx',
  ],
  statusIndicator: [
    'static/app/utils/theme/scraps/theme/base.tsx',
    'static/app/utils/theme/scraps/theme/dark.tsx',
    'static/app/utils/theme/scraps/theme/light.tsx',
    'static/app/utils/theme/scraps/tokens/size.tsx',
  ],
};
const sentryRepository = path.resolve(
  process.env.SENTRY_REPO_PATH ?? '../sentry'
);
const canonicalRoot = 'static/app/components/core';

const localModules = {
  alert: ['src/components/ui/alert.tsx'],
  avatar: ['src/components/ui/avatar.tsx'],
  backdrop: ['src/components/ui/backdrop.tsx'],
  badge: [
    'src/components/ui/badge.tsx',
    'src/components/ui/feature-badge.tsx',
    'src/components/ui/tag.tsx',
  ],
  button: ['src/components/ui/button.tsx'],
  checkbox: ['src/components/ui/checkbox.tsx'],
  code: [
    'src/components/ui/code-block.tsx',
    'src/components/ui/code-messages.tsx',
    'src/components/ui/code.tsx',
  ],
  quote: ['src/components/ui/quote.tsx'],
  text: [
    'src/components/ui/text.tsx',
    'src/components/ui/heading.tsx',
    'src/components/ui/kbd-styles.tsx',
    'src/components/ui/prose.tsx',
    'src/components/ui/text-style-engine.tsx',
  ],
  dragHandle: [
    'src/components/ui/drag-handle.tsx',
    'src/components/ui/use-drag-move.tsx',
    'src/components/ui/use-drag-separator.tsx',
  ],
  input: [
    'src/components/ui/input.tsx',
    'src/components/ui/input-group.tsx',
  ],
  interactionStateLayer: ['src/components/ui/interaction-state-layer.tsx'],
  hotkey: ['src/components/ui/hotkey.tsx'],
  image: ['src/components/ui/image.tsx'],
  layout: ['src/components/ui/layout.tsx'],
  link: ['src/components/ui/link.tsx'],
  radio: ['src/components/ui/radio-group.tsx'],
  revealOnHover: ['src/components/ui/reveal-on-hover.tsx'],
  segmentedControl: ['src/components/ui/segmented-control.tsx'],
  select: ['src/components/ui/select.tsx'],
  separator: ['src/components/ui/separator.tsx'],
  slot: ['src/components/ui/slot.tsx'],
  splitPanel: ['src/components/ui/split-panel.tsx'],
  slider: ['src/components/ui/slider.tsx'],
  statusIndicator: ['src/components/ui/status-indicator.tsx'],
  switch: ['src/components/ui/switch.tsx'],
  table: ['src/components/ui/table.tsx'],
  tabs: ['src/components/ui/tabs.tsx'],
  textarea: ['src/components/ui/textarea.tsx'],
  tooltip: ['src/components/ui/tooltip.tsx'],
};

const registryItems = {
  alert: ['alert'],
  backdrop: ['backdrop'],
  badge: ['badge', 'feature-badge', 'tag'],
  button: ['button'],
  code: ['code'],
  quote: ['quote'],
  text: ['text'],
  dragHandle: ['drag-handle'],
  interactionStateLayer: ['interaction-state-layer'],
  hotkey: ['hotkey'],
  image: ['image'],
  layout: ['layout'],
  separator: ['separator'],
  slot: ['slot'],
  splitPanel: ['split-panel'],
  table: ['table'],
  link: ['link'],
  radio: ['radio-group'],
  revealOnHover: ['reveal-on-hover'],
  segmentedControl: ['segmented-control'],
  slider: ['slider'],
  statusIndicator: ['status-indicator'],
  tooltip: ['tooltip'],
};

const completionEvidence = {
  backdrop:
    'Exact regular Scraps Backdrop overlay geometry, theme colors, layer values, motion, focused assertions, workbench, and self-contained registry delivery are present. The canonical module has no Figma component.',
  code:
    'Exact regular Scraps CodeBlock, InlineCode, reusable inline style recipe, translatable copy messages, Prism language loading, Sentry source notice, executable Storybook state assertions, workbench, and self-contained registry delivery are present. The canonical module has no Figma component.',
  quote:
    'Exact regular Scraps Quote semantic structure, rail geometry, optional citation source, server-component evidence, focused assertions, workbench, and dependency-based registry delivery are present. The canonical module has no Figma component.',
  text:
    'Regular Scraps Text, Heading, and Prose contracts, responsive presentation, inline code and keycap prose composition, focused assertions, workbench, and registry delivery are present. The canonical module has no Figma component.',
  interactionStateLayer:
    'Exact state-layer contract, behavior stories, focused Storybook assertions, and registry publication are present. The canonical module has no Figma component.',
  hotkey:
    'Exact regular Scraps Hotkey, Kbd, and useHotkeys display, platform mapping, layout-aware matching, listener lifecycle, tests, workbench, and self-contained registry delivery are present. The canonical module has no Figma component.',
  image:
    'Exact regular Scraps Image native contract, responsive dimensions and radius, focused assertions, workbench, and self-contained registry delivery are present. The canonical module has no Figma component.',
  dragHandle:
    'Exact regular Scraps drag handle contract, pointer and keyboard behavior, focused assertions, and registry publication are present. The canonical module has no Figma component.',
  layout:
    'Exact regular Scraps layout exports, responsive container and viewport cascade, focused assertions, and registry publication are present. The canonical module has no Figma component.',
  separator:
    'Exact regular Scraps native hr separator contract, focused assertions, and registry publication are present. The canonical module has no Figma component.',
  slot:
    'Exact regular Scraps typed portal slot contract, logical size and container-query context bridge, focused assertions, and registry publication are present. The canonical module has no Figma component.',
  splitPanel:
    'Exact regular Scraps SplitPanel contract, sizing behavior, focused assertions, and registry publication are present. The canonical module has no Figma component.',
  table:
    'Exact regular Scraps Table compound contract, column sizing, resize and sort behavior, focused assertions, and registry publication are present. The canonical module has no Figma component.',
  revealOnHover:
    'Exact regular Scraps RevealOnHover render branches, visibility behavior, focused assertions, and registry publication are present. The canonical module has no Figma component.',
  statusIndicator:
    'Exact regular Scraps StatusIndicator animation, accessibility, focused assertions, and registry publication are present. The canonical module has no Figma component.',
};

const figmaNodes = {
  alert: ['https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=6943-13522'],
  badge: [
    'https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3574-5698',
    'https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3574-5396',
  ],
  button: ['https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=384-2119'],
  checkbox: ['https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3481-4211'],
  radio: ['https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3482-4251'],
  slider: ['https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3538-6616'],
  switch: ['https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3277-4566'],
  textarea: ['https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=3537-20061'],
  tooltip: ['https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B?node-id=6775-627'],
};

const outOfScopeComponents = [
  'src/components/ui/card.tsx',
  'src/components/ui/command.tsx',
  'src/components/ui/dialog.tsx',
  'src/components/ui/dropdown-menu.tsx',
  'src/components/ui/label.tsx',
  'src/components/ui/progress.tsx',
  'src/components/ui/scroll-area.tsx',
  'src/components/ui/sheet.tsx',
  'src/components/ui/size-context.tsx',
];

function readCanonicalFile(repositoryPath) {
  return execFileSync(
    'git',
    ['show', `${CANONICAL_COMMIT}:${repositoryPath}`],
    {cwd: sentryRepository, encoding: 'utf8'}
  );
}

function canonicalPathExists(repositoryPath) {
  try {
    execFileSync(
      'git',
      ['cat-file', '-e', `${CANONICAL_COMMIT}:${repositoryPath}`],
      {cwd: sentryRepository, stdio: 'ignore'}
    );
    return true;
  } catch {
    return false;
  }
}

function resolveCanonicalSource(moduleDirectory, moduleSpecifier) {
  const base = path.posix.join(moduleDirectory, moduleSpecifier);
  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    path.posix.join(base, 'index.tsx'),
    path.posix.join(base, 'index.ts'),
  ]) {
    if (canonicalPathExists(candidate)) {
      return candidate;
    }
  }
  throw new Error(`Parity manifest source missing: ${moduleSpecifier}`);
}

function readCanonicalModule(moduleName) {
  const moduleDirectory = path.posix.join(canonicalRoot, moduleName);
  const indexFilename = canonicalPathExists(path.posix.join(moduleDirectory, 'index.tsx'))
    ? 'index.tsx'
    : 'index.ts';
  const indexPath = path.posix.join(moduleDirectory, indexFilename);
  const source = readCanonicalFile(indexPath);
  const sourceFile = ts.createSourceFile(
    indexFilename,
    source,
    ts.ScriptTarget.Latest,
    true,
    indexFilename.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const sourcePaths = new Set([indexPath]);

  for (const statement of sourceFile.statements) {
    if (
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith('.')
    ) {
      sourcePaths.add(
        resolveCanonicalSource(moduleDirectory, statement.moduleSpecifier.text)
      );
    }
  }

  return {
    indexPath,
    sourcePaths: [...sourcePaths, ...(canonicalBehaviorDependencies[moduleName] ?? [])].sort(),
    publicExports: collectParityManifestExports(source, indexFilename),
  };
}

async function existingPaths(paths) {
  const result = [];
  for (const candidate of paths) {
    try {
      await access(candidate);
      result.push(candidate);
    } catch {}
  }
  return result;
}

const currentCommit = execFileSync('git', ['rev-parse', 'HEAD'], {
  cwd: sentryRepository,
  encoding: 'utf8',
}).trim();
if (currentCommit !== CANONICAL_COMMIT) {
  throw new Error(
    `Parity manifest baseline mismatch: expected ${CANONICAL_COMMIT}, received ${currentCommit}`
  );
}

const moduleNames = execFileSync(
  'git',
  ['ls-tree', '--name-only', '-d', `${CANONICAL_COMMIT}:${canonicalRoot}`],
  {cwd: sentryRepository, encoding: 'utf8'}
)
  .trim()
  .split('\n')
  .filter(name => name && !EXCLUDED_DIRECTORIES.includes(name))
  .sort();

const modules = [];
for (const moduleName of moduleNames) {
  const implementationPaths = [...(localModules[moduleName] ?? [])].sort();
  const kebabName = moduleName.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
  const stories = await existingPaths(
    implementationPaths.map(implementationPath =>
      implementationPath.replace(/\.tsx$/, '.stories.tsx')
    )
  );
  const tests =
    moduleName === 'checkbox'
      ? [
          'tests/e2e/playground.spec.ts',
          'tests/e2e/templates.spec.ts',
          'tests/figma/figma-preview.test.mjs',
        ]
      : moduleName === 'interactionStateLayer'
        ? [
            'tests/e2e/playground.spec.ts',
            'tests/parity/interaction-state-layer.test.mjs',
          ]
        : moduleName === 'layout' || moduleName === 'separator'
          ? ['tests/parity/layout-separator.test.mjs']
          : moduleName === 'slot'
            ? ['src/components/ui/slot.test.tsx', 'tests/parity/slot.test.mjs']
          : moduleName === 'dragHandle'
            ? [
                'src/components/ui/drag-handle.test.tsx',
                'tests/e2e/playground.spec.ts',
              'tests/parity/drag-handle.test.mjs',
            ]
        : moduleName === 'splitPanel'
          ? [
              'src/components/ui/split-panel.test.tsx',
              'tests/e2e/playground.spec.ts',
              'tests/parity/split-panel.test.mjs',
              'tests/types/split-panel-types.test.tsx',
            ]
        : moduleName === 'table'
          ? [
              'src/components/ui/table.test.tsx',
              'tests/e2e/playground.spec.ts',
              'tests/parity/table.test.mjs',
              'tests/types/table-types.test.tsx',
            ]
        : moduleName === 'statusIndicator'
          ? [
              'src/components/ui/status-indicator.test.tsx',
              'tests/e2e/playground.spec.ts',
              'tests/parity/status-indicator.test.mjs',
              'tests/types/status-indicator-types.test.tsx',
            ]
        : moduleName === 'revealOnHover'
          ? [
              'src/components/ui/reveal-on-hover.test.tsx',
              'tests/e2e/playground.spec.ts',
              'tests/parity/reveal-on-hover.test.mjs',
              'tests/types/reveal-on-hover-types.test.tsx',
            ]
        : moduleName === 'hotkey'
          ? [
              'src/components/ui/hotkey.test.tsx',
              'tests/e2e/playground.spec.ts',
              'tests/parity/hotkey.test.mjs',
              'tests/types/hotkey-types.test.tsx',
            ]
        : moduleName === 'image'
          ? [
              'src/components/ui/image.test.tsx',
              'tests/e2e/playground.spec.ts',
              'tests/parity/image.test.mjs',
              'tests/types/image-types.test.tsx',
            ]
        : moduleName === 'backdrop'
          ? [
              'src/components/ui/backdrop.test.tsx',
              'tests/e2e/playground.spec.ts',
              'tests/parity/backdrop.test.mjs',
              'tests/types/backdrop-types.test.tsx',
            ]
        : moduleName === 'code'
          ? [
              'src/components/ui/code.test.tsx',
              'src/components/ui/prism-concurrent.test.ts',
              'src/components/ui/prism.test.ts',
              'tests/e2e/playground.spec.ts',
              'tests/parity/code.test.mjs',
              'tests/types/code-types.test.tsx',
            ]
        : moduleName === 'quote'
          ? [
              'src/app/evidence/quote-server/page.tsx',
              'src/components/ui/quote.test.tsx',
              'tests/e2e/playground.spec.ts',
              'tests/parity/quote.test.mjs',
              'tests/types/quote-types.test.tsx',
            ]
        : moduleName === 'text'
          ? [
              'src/components/ui/text.test.tsx',
              'tests/e2e/playground.spec.ts',
              'tests/parity/text-ssr.test.mjs',
              'tests/parity/text.test.mjs',
              'tests/types/text-types.test.tsx',
            ]
        : [];
  const completionNote = completionEvidence[moduleName];

  modules.push({
    name: moduleName,
    canonical: await readCanonicalModule(moduleName),
    local: {
      implementationPaths,
      implementedExports: await collectParityManifestFileExports(implementationPaths),
      registryItems: [...(registryItems[moduleName] ?? [])].sort(),
      stories,
      tests,
      codeConnect:
        moduleName === 'checkbox' ? ['src/components/ui/checkbox.figma.ts'] : [],
      figmaNodes: [...(figmaNodes[moduleName] ?? [])].sort(),
      playgroundPath:
        moduleName === 'dragHandle'
          ? '/?component=drag-handle'
          : moduleName === 'splitPanel'
            ? '/?component=split-panel'
          : moduleName === 'table'
            ? '/?component=table'
          : moduleName === 'statusIndicator'
            ? '/?component=status-indicator'
            : moduleName === 'revealOnHover'
              ? '/?component=reveal-on-hover'
            : moduleName === 'hotkey'
              ? '/?component=hotkey'
              : moduleName === 'image'
                ? '/?component=image'
              : moduleName === 'backdrop'
                ? '/?component=backdrop'
          : moduleName === 'code'
            ? '/?component=code'
            : moduleName === 'quote'
              ? '/?component=quote'
              : moduleName === 'text'
                ? '/?component=text'
              : moduleName === 'checkbox' ||
                  moduleName === 'interactionStateLayer' ||
                  moduleName === 'layout' ||
                  moduleName === 'separator' ||
                  moduleName === 'slot'
                ? '/?component=checkbox'
                : null,
    },
    completion: {
      state: completionNote
        ? 'complete'
        : implementationPaths.length > 0
          ? 'partial'
          : 'missing',
      complete: Boolean(completionNote),
      note: completionNote ??
        (implementationPaths.length > 0
          ? 'A local implementation exists, but exact contract, behavior, visual, registry, and Figma gates have not all passed.'
          : `No local ${kebabName} implementation is mapped.`),
    },
  });
}

const manifest = {
  schemaVersion: 1,
  canonical: {
    repository: 'getsentry/sentry',
    commit: CANONICAL_COMMIT,
    root: 'static/app/components/core',
    excludedDirectories: EXCLUDED_DIRECTORIES,
  },
  scope: {
    targetModuleCount: 48,
    outOfScopeLocalComponents: outOfScopeComponents,
  },
  modules,
};

const manifestOutput = process.env.PARITY_MANIFEST_OUTPUT ?? 'scraps-parity.json';
await writeFile(manifestOutput, `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`Generated ${manifestOutput} with ${modules.length} modules.\n`);
