import {createHash} from 'node:crypto';
import {access, readFile, readdir} from 'node:fs/promises';

import {collectParityManifestFileExports} from './parity-manifest-exports.mjs';

const CANONICAL_COMMIT = 'd91f823d232ddd12a4d2a64554d85fd36df0e278';
const EXPECTED_EXPORT_HASHES = {
  alert: '6179f3951744d0fa0770984a1603f6c7a55c4d073ebd5c837c21321581b5e6ca',
  avatar: '27f149882c7c278be7b55289a14cdec41f31d39d56af8d64313b2f4ef5d2dff6',
  avatarButton: '64e78b90bb37c598d8da6ef602c2190b3e5dd05e11be7a76085c9c7bc32f603a',
  backdrop: '2d954ee7c868666c5f0734724404dc505cf34a8c906b1f7cbee7149cb74934af',
  badge: 'dcaedffa3de295f2c800a8aaa9c9a1e62a6710d0649a2541a0d6fcbb97e6fa2f',
  breadcrumbList: '45441b1f2937588d124ad07f41bdc09a955047ed821cb11718ec51770a690992',
  button: '1dbe36bed2a20d1b9cc76bbbb566cb63cde8d1ff531e7055019b7488cd1bed7e',
  chat: '7d393781cf645320006b589043c519e8add57759254a00c5c33ad4f2c39dcd55',
  checkbox: '2bccf04bfeb143ad1c24475b5f3c9505683867039dc9b7eaa03b232c99ba9fc7',
  chip: '8e788598d905b777c01d8949ac176890f04fb64377fbdf58282379200d2a9f6a',
  code: '0ea55946b1e42962ae88db719e8eefd85922e45681d5b1bbb94232ee52906f59',
  compactSelect: 'e6c7cf7e8302acf6a4c997ac1555c8450bcf0cd4b73e557c5596f1973953de4b',
  disclosure: '9041743e6bfc74a42afc157d9f5cc5f72525970d7360d5b310e92bec1a6dd355',
  dragHandle: '490ee01654a24b87dee7b48a104436ca513d71e17c85b322f8797fd242eaf472',
  drawer: 'd41ac11f0d70917d34ed91dbab6076ddc2d1993e43cf107b38011ff091360dc3',
  emptyState: '04dd848a4ff318113d7a4067621b8de34ec0206bf2028ae33091bf93f95444cf',
  form: '7ae992af2b921b00df4171c85474d294cb60cbd1496e3fad18e2bc59e9d9b43b',
  hotkey: 'a0addbd9db57a1ff63a2d0ded61853a7f84ff97e4c6f263e4c5c79c64abe2cc8',
  image: 'ec82fbe4600dcc9739c385f12da4d3ca274b34c162a6f0bdd5661b7e4240ec2c',
  info: 'b4fd2354c5e79ed86f18164ce0ea3d7d593f1a35b5d79c1fa856c7a93d0d7b06',
  input: '220cb54816ec79cabf9bf8f1507422aa37a64e1bdfad68f95d5610b07b499b3f',
  interactionStateLayer: '7c854731be10e88c9b38e22c4f88b2896c6434cf2fc4133c55512bf92777ba20',
  layout: 'e0029f9dd8c4259067358d6b25c5332a7b18b66579f34ca577eeab504c127c92',
  link: '7ed0c825c0d7ef99c21d8e9777d050d75c8a50d4872825d990c78ea706793130',
  loader: 'e9c5bb1e9bd2f64a4b14bdeb34db834aa499e897cf58271882e4e224c57b15b9',
  markdown: '5abce650069702e3b6f033f7d19755df548e4832d34b61ed56610fbd4d4c9a0f',
  menuListItem: 'fb257b80ec85b69a825f9bdbe545d96beea98cfcf732ed054b836ae70b18ee4f',
  modal: '0aab4945b10f6ddc616871091574488325b1be22272758849ef5efc12ae90e78',
  pagination: '19e88e545844740e571eb05439fbcf48435986d2e08e42f506ce6285f95a524b',
  pictureInPicture: '381fb8129361b80da0c4cb8aee3dff41e42be17f9e465508e02b95b2c800802d',
  quote: 'c689ecdb2455e5a62618342d98bdf451805582ce79aaa646b70884ee40ff9311',
  radio: '2d81a420a08de0a907b4cbf6ca4397ab5d414d524a16d5c9eb5679c51d9dbab4',
  revealOnHover: 'c869444f4e4bcf609d84250e06efc42ba149c9836092344ca8238c5b0af633e7',
  segmentedControl: '9aa791fcf0293679e25af62136b787c8ae15aca16dfe988ae92448f0636e37d6',
  select: 'a668b49d8ac99f1af4b1cdc6566bd1e4bc96a6ea48aca4308005ab53b5c9fed3',
  separator: 'a4d2b99cb8feaf15203adb4fd0be73a84568c276fcf62220d13f4717afa44c31',
  slideOverPanel: 'd40c166928be1024aeb22b64fbcc0bdba02b39b8c5aa89aae9692ae482ff404b',
  slider: 'dbc97f5e3a6a064bd6bbe7118d094f48132e83315810203ada0eeeec64b3d165',
  slot: '784cb004f7cd2a6a3bd396537fb68a6a0b8dcc96c62a86002fccee18c176fe2d',
  splitPanel: 'bd39e7a84210bc0585753db6c88f5bd16aebe9dc8589e9175e7620fdc68a7d28',
  statusIndicator: '0ac6a0a147a2aa1da6f46e191d38d981cf645c62aa0bd94cfb9aae3ca60e447b',
  switch: '52836df3fdf2485d6656bbb2f859303b9dfb1b66ea35c9bc22d2ee103db56526',
  table: '3b07413df631a1798dede81031335e72ae34f183f3fa57cbcabde0f4e8f8bd08',
  tabs: 'a3e08f017acdfb1c83f0195d1cd714d4b42f10afb533dd2762cf0c88891b89e6',
  text: '1353bbe83857791070516d8eb3d49a285e697037af58b02da596992248a45b02',
  textarea: '2aeee15d19ba0c9bcc4185ec2353e0aae004d34fa348e3154cc9811db777a109',
  toast: 'f46dd66d3b91322ec4f260e3fb3b156885a758bbb665f65d314b47f1e27da7d9',
  tooltip: 'b1eefc1536d33990ab83791244fd05c8d9190e3fdb551aeca44be5249e00ac19',
};

function parityManifestError(message) {
  throw new Error(`Parity manifest invalid: ${message}`);
}

function assertSortedUnique(values, label) {
  if (!Array.isArray(values)) parityManifestError(`${label} must be an array`);
  const sorted = [...new Set(values)].sort();
  if (JSON.stringify(values) !== JSON.stringify(sorted)) {
    parityManifestError(`${label} must be sorted and contain no duplicates`);
  }
}

function hashPublicExports(publicExports) {
  return createHash('sha256').update(JSON.stringify(publicExports)).digest('hex');
}

async function assertPathsExist(paths, label) {
  for (const filePath of paths) {
    try {
      await access(filePath);
    } catch {
      parityManifestError(`${label} points to missing file ${filePath}`);
    }
  }
}

const manifestPath = process.env.PARITY_MANIFEST_PATH ?? 'scraps-parity.json';
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const registry = JSON.parse(await readFile('registry.json', 'utf8'));
const expectedModuleNames = Object.keys(EXPECTED_EXPORT_HASHES).sort();
const moduleNames = manifest.modules.map(parityModule => parityModule.name);

if (manifest.schemaVersion !== 1) parityManifestError('schemaVersion must be 1');
if (manifest.canonical.commit !== CANONICAL_COMMIT) {
  parityManifestError(`canonical commit must be ${CANONICAL_COMMIT}`);
}
if (manifest.scope.targetModuleCount !== 48 || manifest.modules.length !== 48) {
  parityManifestError('scope must contain exactly 48 regular Scraps modules');
}
if (JSON.stringify(moduleNames) !== JSON.stringify(expectedModuleNames)) {
  parityManifestError('module names must match the pinned regular Scraps inventory');
}
if (
  JSON.stringify(manifest.canonical.excludedDirectories) !==
  JSON.stringify(['overview', 'patterns', 'principles'])
) {
  parityManifestError('only the three documentation directories may be excluded');
}

const registryByName = new Map(registry.items.map(item => [item.name, item]));
const claimedImplementationPaths = [];
let partialCount = 0;
let completeCount = 0;

for (const parityModule of manifest.modules) {
  const label = `modules.${parityModule.name}`;
  const {canonical, local, completion} = parityModule;
  assertSortedUnique(canonical.sourcePaths, `${label}.canonical.sourcePaths`);
  assertSortedUnique(canonical.publicExports.runtime, `${label}.canonical.publicExports.runtime`);
  assertSortedUnique(canonical.publicExports.types, `${label}.canonical.publicExports.types`);
  assertSortedUnique(local.implementationPaths, `${label}.local.implementationPaths`);
  assertSortedUnique(local.implementedExports.runtime, `${label}.local.implementedExports.runtime`);
  assertSortedUnique(local.implementedExports.types, `${label}.local.implementedExports.types`);
  assertSortedUnique(local.registryItems, `${label}.local.registryItems`);
  assertSortedUnique(local.stories, `${label}.local.stories`);
  assertSortedUnique(local.tests, `${label}.local.tests`);
  assertSortedUnique(local.codeConnect, `${label}.local.codeConnect`);
  assertSortedUnique(local.figmaNodes, `${label}.local.figmaNodes`);

  if (!canonical.sourcePaths.includes(canonical.indexPath)) {
    parityManifestError(`${label}.canonical.sourcePaths must include indexPath`);
  }
  if (
    hashPublicExports(canonical.publicExports) !==
    EXPECTED_EXPORT_HASHES[parityModule.name]
  ) {
    parityManifestError(`${label}.canonical.publicExports differs from the pinned contract`);
  }

  const localPaths = [
    ...local.implementationPaths,
    ...local.stories,
    ...local.tests,
    ...local.codeConnect,
  ];
  await assertPathsExist(localPaths, label);
  claimedImplementationPaths.push(...local.implementationPaths);

  const currentExports = await collectParityManifestFileExports(
    local.implementationPaths
  );
  if (JSON.stringify(currentExports) !== JSON.stringify(local.implementedExports)) {
    parityManifestError(`${label}.local.implementedExports is stale`);
  }

  for (const registryItemName of local.registryItems) {
    const registryItem = registryByName.get(registryItemName);
    if (!registryItem) parityManifestError(`${label} references unknown registry item ${registryItemName}`);
    const registryPaths = registryItem.files.map(file => file.path);
    if (!registryPaths.some(filePath => local.implementationPaths.includes(filePath))) {
      parityManifestError(`${label} registry item ${registryItemName} does not publish a mapped implementation`);
    }
  }
  for (const figmaNode of local.figmaNodes) {
    if (!/^https:\/\/www\.figma\.com\/design\/[\w-]+\?node-id=\d+-\d+$/.test(figmaNode)) {
      parityManifestError(`${label} has an invalid Figma node URL`);
    }
  }

  if (completion.state === 'missing') {
    if (local.implementationPaths.length > 0 || completion.complete) {
      parityManifestError(`${label} cannot be missing with a local implementation`);
    }
  } else if (completion.state === 'partial') {
    partialCount += 1;
    if (local.implementationPaths.length === 0 || completion.complete) {
      parityManifestError(`${label} cannot be partial without an incomplete implementation`);
    }
  } else if (completion.state === 'complete') {
    completeCount += 1;
    const missingRuntimeExport = canonical.publicExports.runtime.find(
      exportName => !local.implementedExports.runtime.includes(exportName)
    );
    const missingTypeExport = canonical.publicExports.types.find(
      exportName => !local.implementedExports.types.includes(exportName)
    );
    if (
      !completion.complete ||
      local.registryItems.length === 0 ||
      local.stories.length === 0 ||
      local.tests.length === 0 ||
      missingRuntimeExport ||
      missingTypeExport
    ) {
      parityManifestError(`${label} does not meet the machine-checkable complete contract`);
    }
  } else {
    parityManifestError(`${label}.completion.state is unknown`);
  }
}

assertSortedUnique(manifest.scope.outOfScopeLocalComponents, 'scope.outOfScopeLocalComponents');
await assertPathsExist(manifest.scope.outOfScopeLocalComponents, 'scope.outOfScopeLocalComponents');
const localUiFiles = (await readdir('src/components/ui'))
  .filter(
    filename =>
      filename.endsWith('.tsx') &&
      !filename.includes('.stories.') &&
      !filename.includes('.test.')
  )
  .map(filename => `src/components/ui/${filename}`)
  .sort();
const classifiedLocalFiles = [
  ...claimedImplementationPaths,
  ...manifest.scope.outOfScopeLocalComponents,
].sort();
if (JSON.stringify(localUiFiles) !== JSON.stringify(classifiedLocalFiles)) {
  parityManifestError('every local UI implementation must be mapped or explicitly out of scope');
}

process.stdout.write(
  `Validated 48 modules: ${completeCount} complete, ${partialCount} partial, ${48 - partialCount - completeCount} missing.\n`
);
