import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import test from 'node:test';

test('records the interaction state layer as the only completed state primitive', async () => {
  const manifest = JSON.parse(await readFile('scraps-parity.json', 'utf8'));
  const interactionStateLayer = manifest.modules.find(
    ({name}) => name === 'interactionStateLayer'
  );

  assert.deepEqual(interactionStateLayer.local.implementationPaths, [
    'src/components/ui/interaction-state-layer.tsx',
  ]);
  assert.deepEqual(interactionStateLayer.local.registryItems, ['interaction-state-layer']);
  assert.deepEqual(interactionStateLayer.local.tests, [
    'tests/e2e/playground.spec.ts',
    'tests/parity/interaction-state-layer.test.mjs',
  ]);
  assert.equal(interactionStateLayer.local.playgroundPath, '/?component=checkbox');
  assert.equal(interactionStateLayer.completion.state, 'complete');
  assert.equal(interactionStateLayer.completion.complete, true);
  assert.deepEqual(interactionStateLayer.local.figmaNodes, []);
});

test('publishes a registry that passes the installed shadcn schema', () => {
  const output = execFileSync(
    'pnpm',
    ['exec', 'shadcn', 'registry', 'validate', 'registry.json'],
    {cwd: process.cwd(), encoding: 'utf8'}
  );

  assert.match(output, /registry\.json/);
});

test('keeps press and disabled selectors at least as specific as hover', async () => {
  const stylesheet = await readFile(
    'src/components/ui/interaction-state-layer.module.css',
    'utf8'
  );

  assert.match(
    stylesheet,
    /:active > \.interactionStateLayer\.interactionStateLayer\[data-is-pressed='undefined'\]/
  );
  assert.match(
    stylesheet,
    /\.interactionStateLayer\.interactionStateLayer\.interactionStateLayer\[data-is-pressed='true'\]/
  );
  assert.match(
    stylesheet,
    /:disabled \.interactionStateLayer\.interactionStateLayer\.interactionStateLayer\.interactionStateLayer/
  );
  assert.match(
    stylesheet,
    /\[aria-disabled='true'\] \.interactionStateLayer\.interactionStateLayer\.interactionStateLayer\.interactionStateLayer/
  );
});
