import { execFileSync } from "node:child_process";
import path from "node:path";

import { collectParityManifestExports } from "./parity-manifest-exports.mjs";

export const CANONICAL_ROOT = "static/app/components/core";
export const EXCLUDED_DIRECTORIES = ["overview", "patterns", "principles"];

const standaloneClassifications = {
  "boundaryContext.tsx": {
    kind: "shared-public-api",
    reason: "Shared boundary context used by component families.",
  },
  "datetime.spec.tsx": {
    kind: "test-support",
    reason: "Canonical tests for the standalone DateTime API.",
  },
  "datetime.tsx": {
    kind: "public-component-api",
    reason: "Public DateTime provider and hooks imported through @sentry/scraps/datetime.",
  },
  "overlayTrigger.tsx": {
    kind: "public-component-api",
    reason: "Public trigger component imported through @sentry/scraps/overlayTrigger.",
  },
  "renderToString.spec.tsx": {
    kind: "test-support",
    reason: "Canonical tests for the standalone render helper.",
  },
  "renderToString.tsx": {
    kind: "explicit-exclusion",
    reason: "Emotion-coupled rendering helper documented as a pattern, not a component family.",
  },
  "sizeContext.tsx": {
    kind: "shared-public-api",
    reason: "Shared size provider and hook used by component families and monolith callers.",
  },
  "trackingContext.tsx": {
    kind: "shared-public-api",
    reason: "Shared tracking provider and hook used by Button and Link.",
  },
  "translationContext.tsx": {
    kind: "shared-public-api",
    reason: "Shared translation provider and hook used by component families.",
  },
  "useIsInsideInteractiveElement.ts": {
    kind: "shared-public-api",
    reason: "Shared focus-state hook used by FeatureBadge.",
  },
  "useScrollLock.spec.tsx": {
    kind: "test-support",
    reason: "Canonical tests for the shared scroll-lock hook.",
  },
  "useScrollLock.tsx": {
    kind: "shared-public-api",
    reason: "Shared scroll-lock hook used by overlays and monolith callers.",
  },
};

function canonicalPathExists(repository, commit, repositoryPath) {
  try {
    execFileSync("git", ["cat-file", "-e", `${commit}:${repositoryPath}`], {
      cwd: repository,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

function readRootEntries(repository, commit, root) {
  const output = execFileSync("git", ["ls-tree", "-z", `${commit}:${root}`], {
    cwd: repository,
    encoding: "utf8",
  });

  return output
    .split("\0")
    .filter(Boolean)
    .map((record) => {
      const match = record.match(/^\d+ (blob|tree) [0-9a-f]+\t(.+)$/);
      if (!match) throw new Error(`Could not parse canonical tree entry: ${record}`);
      return { name: match[2], type: match[1] };
    });
}

function readPublicExports(repository, commit, repositoryPath) {
  const source = execFileSync("git", ["show", `${commit}:${repositoryPath}`], {
    cwd: repository,
    encoding: "utf8",
  });
  return collectParityManifestExports(source, path.posix.basename(repositoryPath));
}

export function discoverCanonicalInventory({ commit, repository, root = CANONICAL_ROOT }) {
  const rootEntries = readRootEntries(repository, commit, root);
  const componentEntryPoints = [];
  const unclassifiedDirectories = [];

  for (const entry of rootEntries.filter(({ type }) => type === "tree")) {
    if (EXCLUDED_DIRECTORIES.includes(entry.name)) continue;
    const directory = path.posix.join(root, entry.name);
    const indexPath = ["index.tsx", "index.ts"]
      .map((filename) => path.posix.join(directory, filename))
      .find((candidate) => canonicalPathExists(repository, commit, candidate));
    if (indexPath) componentEntryPoints.push({ name: entry.name, path: indexPath });
    else unclassifiedDirectories.push(entry.name);
  }

  const standaloneSourceFiles = rootEntries
    .filter(({ name, type }) => type === "blob" && /\.(?:ts|tsx)$/.test(name))
    .map(({ name }) => name)
    .sort();
  const standaloneFiles = standaloneSourceFiles
    .filter((filePath) => filePath in standaloneClassifications)
    .map((filePath) => {
      const classification = standaloneClassifications[filePath];
      const tracksPublicExports = [
        "explicit-exclusion",
        "public-component-api",
        "shared-public-api",
      ].includes(classification.kind);
      return {
        path: filePath,
        ...classification,
        ...(tracksPublicExports
          ? {
              publicExports: readPublicExports(repository, commit, path.posix.join(root, filePath)),
            }
          : {}),
      };
    });
  const unclassifiedStandaloneFiles = standaloneSourceFiles.filter(
    (filePath) => !(filePath in standaloneClassifications),
  );
  const missingClassifiedStandaloneFiles = Object.keys(standaloneClassifications)
    .filter((filePath) => !standaloneSourceFiles.includes(filePath))
    .sort();

  return {
    componentEntryPoints: componentEntryPoints.sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
    standaloneFiles,
    unclassifiedDirectories: unclassifiedDirectories.sort(),
    unclassifiedStandaloneFiles,
    missingClassifiedStandaloneFiles,
  };
}
