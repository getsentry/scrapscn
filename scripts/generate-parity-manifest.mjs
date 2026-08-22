import {access, readFile, readdir, writeFile} from 'node:fs/promises';
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
};
const sentryRepository = path.resolve(
  process.env.SENTRY_REPO_PATH ?? '../sentry'
);
const canonicalRoot = path.join(
  sentryRepository,
  'static/app/components/core'
);

const localModules = {
  alert: ['src/components/ui/alert.tsx'],
  avatar: ['src/components/ui/avatar.tsx'],
  badge: [
    'src/components/ui/badge.tsx',
    'src/components/ui/feature-badge.tsx',
    'src/components/ui/tag.tsx',
  ],
  button: ['src/components/ui/button.tsx'],
  checkbox: ['src/components/ui/checkbox.tsx'],
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
  layout: ['src/components/ui/layout.tsx'],
  link: ['src/components/ui/link.tsx'],
  radio: ['src/components/ui/radio-group.tsx'],
  segmentedControl: ['src/components/ui/segmented-control.tsx'],
  select: ['src/components/ui/select.tsx'],
  separator: ['src/components/ui/separator.tsx'],
  slot: ['src/components/ui/slot.tsx'],
  splitPanel: ['src/components/ui/split-panel.tsx'],
  slider: ['src/components/ui/slider.tsx'],
  switch: ['src/components/ui/switch.tsx'],
  table: ['src/components/ui/table.tsx'],
  tabs: ['src/components/ui/tabs.tsx'],
  textarea: ['src/components/ui/textarea.tsx'],
  tooltip: ['src/components/ui/tooltip.tsx'],
};

const registryItems = {
  alert: ['alert'],
  badge: ['badge', 'feature-badge', 'tag'],
  button: ['button'],
  dragHandle: ['drag-handle'],
  interactionStateLayer: ['interaction-state-layer'],
  layout: ['layout'],
  separator: ['separator'],
  slot: ['slot'],
  splitPanel: ['split-panel'],
  table: ['table'],
  link: ['link'],
  radio: ['radio-group'],
  segmentedControl: ['segmented-control'],
  slider: ['slider'],
  tooltip: ['tooltip'],
};

const completionEvidence = {
  interactionStateLayer:
    'Exact state-layer contract, behavior stories, focused Storybook assertions, and registry publication are present. The canonical module has no Figma component.',
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

async function resolveCanonicalSource(moduleDirectory, moduleSpecifier) {
  const base = path.join(moduleDirectory, moduleSpecifier);
  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    path.join(base, 'index.tsx'),
    path.join(base, 'index.ts'),
  ]) {
    try {
      await access(candidate);
      return path.relative(sentryRepository, candidate);
    } catch {}
  }
  throw new Error(`Parity manifest source missing: ${moduleSpecifier}`);
}

async function readCanonicalModule(moduleName) {
  const moduleDirectory = path.join(canonicalRoot, moduleName);
  const filenames = await readdir(moduleDirectory);
  const indexFilename = filenames.includes('index.tsx') ? 'index.tsx' : 'index.ts';
  const indexPath = path.join(moduleDirectory, indexFilename);
  const source = await readFile(indexPath, 'utf8');
  const sourceFile = ts.createSourceFile(
    indexFilename,
    source,
    ts.ScriptTarget.Latest,
    true,
    indexFilename.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const sourcePaths = new Set([path.relative(sentryRepository, indexPath)]);

  for (const statement of sourceFile.statements) {
    if (
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text.startsWith('.')
    ) {
      sourcePaths.add(
        await resolveCanonicalSource(moduleDirectory, statement.moduleSpecifier.text)
      );
    }
  }

  return {
    indexPath: path.relative(sentryRepository, indexPath),
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

const moduleNames = (await readdir(canonicalRoot, {withFileTypes: true}))
  .filter(entry => entry.isDirectory() && !EXCLUDED_DIRECTORIES.includes(entry.name))
  .map(entry => entry.name)
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

await writeFile('scraps-parity.json', `${JSON.stringify(manifest, null, 2)}\n`);
process.stdout.write(`Generated scraps-parity.json with ${modules.length} modules.\n`);
