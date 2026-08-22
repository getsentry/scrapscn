import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdtemp, readFile, rm, writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import test from 'node:test';

const validatorPath = path.resolve('scripts/validate-parity-manifest.mjs');
const manifest = JSON.parse(await readFile('scraps-parity.json', 'utf8'));

function runParityValidator(manifestPath) {
  return spawnSync(process.execPath, [validatorPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {...process.env, PARITY_MANIFEST_PATH: manifestPath},
  });
}

async function withChangedManifest(change, assertion) {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'scrapscn-parity-'));
  const manifestPath = path.join(temporaryDirectory, 'scraps-parity.json');
  const changedManifest = structuredClone(manifest);
  change(changedManifest);
  await writeFile(manifestPath, JSON.stringify(changedManifest));
  try {
    assertion(runParityValidator(manifestPath));
  } finally {
    await rm(temporaryDirectory, {recursive: true});
  }
}

test('accepts the pinned 48-module parity inventory', () => {
  const output = execFileSync(process.execPath, [validatorPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  assert.match(output, /Validated 48 modules: 7 complete, 15 partial, 26 missing/);
});

test('rejects a missing canonical module', async () => {
  await withChangedManifest(
    changedManifest => changedManifest.modules.pop(),
    result => {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /scope must contain exactly 48 regular Scraps modules/);
    }
  );
});

test('rejects a missing canonical public export', async () => {
  await withChangedManifest(
    changedManifest => {
      changedManifest.modules.find(({name}) => name === 'checkbox').canonical.publicExports.runtime = [];
    },
    result => {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /canonical\.publicExports differs from the pinned contract/);
    }
  );
});

test('rejects an unsupported complete claim', async () => {
  await withChangedManifest(
    changedManifest => {
      const checkbox = changedManifest.modules.find(({name}) => name === 'checkbox');
      checkbox.completion = {state: 'complete', complete: true, note: 'Done.'};
    },
    result => {
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /does not meet the machine-checkable complete contract/);
    }
  );
});
