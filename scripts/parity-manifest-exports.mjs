import { readFile } from "node:fs/promises";

import ts from "typescript";

/** Reads the named runtime and type exports that are visible in one TypeScript source file. */
export function collectParityManifestExports(source, filename) {
  const sourceFile = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true,
    filename.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const runtime = [];
  const types = [];

  for (const statement of sourceFile.statements) {
    if (
      ts.isExportDeclaration(statement) &&
      statement.exportClause &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        const destination = statement.isTypeOnly || element.isTypeOnly ? types : runtime;
        destination.push(element.name.text);
      }
      continue;
    }

    if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      continue;
    }

    if (
      (ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isEnumDeclaration(statement)) &&
      statement.name
    ) {
      runtime.push(statement.name.text);
    } else if (
      (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) &&
      statement.name
    ) {
      types.push(statement.name.text);
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) runtime.push(declaration.name.text);
      }
    }
  }

  return {
    runtime: [...new Set(runtime)].sort(),
    types: [...new Set(types)].sort(),
  };
}

export async function collectParityManifestFileExports(paths) {
  const runtime = [];
  const types = [];
  for (const filePath of paths) {
    const exports = collectParityManifestExports(await readFile(filePath, "utf8"), filePath);
    runtime.push(...exports.runtime);
    types.push(...exports.types);
  }
  return {
    runtime: [...new Set(runtime)].sort(),
    types: [...new Set(types)].sort(),
  };
}
