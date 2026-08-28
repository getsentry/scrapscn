import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm, stat, symlink, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import ts from "typescript";

export const CANONICAL_COMMIT = "a2db8365e2ec17c96b200bface596081c68f12c9";
const EXPECTED_PINNED_CORE_DIAGNOSTIC_HASH =
  "e3ef63e0c4c81b73c8795681b64819c26324c0885af581468f3bd9391356a993";
export const excludedContractInputDescriptors = [
  {
    id: "tooltip.overlayStyle.serializedStyles",
    canonicalSymbol: "TooltipProps.overlayStyle",
    excludedInput: "SerializedStyles",
    targetKind: "union-member",
    localInput: "React.CSSProperties",
    canonicalEvidencePaths: [
      "static/app/components/core/tooltip/tooltip.tsx",
      "static/app/components/replays/breadcrumbs/replayTimelineEvents.tsx",
    ],
    migrationRequirement:
      "Translate the replay rule into Tailwind or static CSS; changing only the import path is insufficient.",
  },
  {
    id: "modal.modalCss.interpolation",
    canonicalSymbol: "ModalOptions.modalCss",
    excludedInput: "Interpolation<Theme>",
    targetKind: "direct-aliased-reference",
    localInput: "Tailwind class string",
    canonicalEvidencePaths: [
      "static/app/components/core/modal/index.tsx",
      "static/app/actionCreators/modal.tsx",
    ],
    migrationRequirement:
      "Translate the Emotion interpolation into Tailwind classes or static CSS; changing only the import path is insufficient.",
  },
  {
    id: "layout.renderFunction.arbitraryCssProperties",
    canonicalSymbol: "ContainerPropsWithRenderFunction",
    excludedInput: "React.CSSProperties",
    targetKind: "generic-alias-indexed-access-members",
    localInput: "Finite render-function fields only",
    canonicalEvidencePaths: ["static/app/components/core/layout/container.tsx"],
    migrationRequirement:
      "Use the ordinary as form or move the dynamic value into the target component static Tailwind or CSS; changing only the import path is insufficient.",
  },
  {
    id: "select.stylesConfig.arbitraryNestedSelectors",
    canonicalSymbol: "StylesConfig",
    excludedInput: "Open-ended nested CSS selectors",
    targetKind: "exported-alias",
    localInput: "Flat declarations, pinned nested selectors, or replacement components",
    canonicalEvidencePaths: ["static/app/components/core/select/select.tsx"],
    migrationRequirement:
      "Translate an unrecognized nested selector into literal Tailwind or static CSS; changing only the import path is insufficient for that selector.",
  },
];

function resolveAlias(checker, symbol) {
  const visited = new Set();
  let current = symbol;
  while (current?.flags & ts.SymbolFlags.Alias && !visited.has(current)) {
    visited.add(current);
    const next = checker.getImmediateAliasedSymbol(current);
    if (!next || next === current || typeof next.flags !== "number") break;
    current = next;
  }
  return current;
}

function stableTypeKey(type) {
  return `${type.id}:${type.symbol?.getName() ?? type.aliasSymbol?.getName() ?? ""}`;
}

function normalizedDeclarationPath(fileName) {
  const normalized = fileName.replaceAll("\\", "/");
  const nodeModulesIndex = normalized.lastIndexOf("/node_modules/");
  return nodeModulesIndex === -1 ? normalized : normalized.slice(nodeModulesIndex + 1);
}

function symbolDeclarationIdentities(checker, symbol) {
  const symbols = new Set();
  const addSymbol = (candidate) => {
    if (!candidate || typeof candidate.flags !== "number") return;
    symbols.add(candidate);
    const resolved = resolveAlias(checker, candidate);
    if (resolved && typeof resolved.flags === "number") symbols.add(resolved);
    for (const root of checker.getRootSymbols?.(candidate) ?? []) symbols.add(root);
  };
  addSymbol(symbol);
  const identities = new Set();
  for (const candidate of symbols) {
    for (const declaration of candidate.declarations ?? []) {
      identities.add(
        `${normalizedDeclarationPath(declaration.getSourceFile().fileName)}:${declaration.pos}:${declaration.end}:${candidate.getName()}`,
      );
    }
  }
  return identities;
}

function isSafeType(type) {
  return Boolean(type) && !(type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown));
}

function isTargetType(checker, type, target) {
  if (!isSafeType(type)) return false;
  const candidates = [type.symbol, type.aliasSymbol];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (target.symbols.has(candidate) || target.symbols.has(resolveAlias(checker, candidate))) {
      return true;
    }
    for (const identity of symbolDeclarationIdentities(checker, candidate)) {
      if (target.declarationIdentities.has(identity)) return true;
    }
  }
  return false;
}

function isTargetSymbol(checker, symbol, target) {
  if (!symbol) return false;
  if (target.symbols.has(symbol) || target.symbols.has(resolveAlias(checker, symbol))) {
    return true;
  }
  return [...symbolDeclarationIdentities(checker, symbol)].some((identity) =>
    target.declarationIdentities.has(identity),
  );
}

function targetMemberTrace(checker, type, target, trace) {
  if (isTargetType(checker, type, target)) return trace;
  if (
    type.isUnionOrIntersection() &&
    type.types.some((member) => isTargetType(checker, member, target))
  ) {
    return `${trace} > union`;
  }
  return undefined;
}

function targetFromSymbol(checker, symbol) {
  const resolved = resolveAlias(checker, symbol);
  const symbols = new Set([symbol, resolved].filter(Boolean));
  const declarationIdentities = symbolDeclarationIdentities(checker, symbol);
  if (declarationIdentities.size === 0) {
    throw new Error(`Cannot resolve ${symbol.getName()} declaration identity`);
  }
  return { symbols, declarationIdentities };
}

function exportedTypeAlias(checker, source, exportName) {
  const moduleSymbol = checker.getSymbolAtLocation(source);
  const exported = moduleSymbol
    ? checker
        .getExportsOfModule(moduleSymbol)
        .find((candidate) => candidate.getName() === exportName)
    : undefined;
  const symbol = exported && resolveAlias(checker, exported);
  const declarations = symbol?.declarations?.filter(ts.isTypeAliasDeclaration) ?? [];
  if (declarations.length !== 1 || declarations[0].getSourceFile() !== source) {
    throw new Error(`Cannot find input ${exportName}`);
  }
  if (!declarations[0].typeParameters?.length) {
    throw new Error(`${exportName} must remain a generic type alias`);
  }
  return { declaration: declarations[0], symbol };
}

function importedQualifiedTypeTarget(checker, source, qualifiedName) {
  const [qualifier, exportName, ...rest] = qualifiedName.split(".");
  if (!qualifier || !exportName || rest.length > 0) {
    throw new Error(`Cannot resolve excluded input ${qualifiedName}`);
  }
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
    const namedBindings = statement.importClause.namedBindings;
    const importsQualifier =
      statement.importClause.name?.text === qualifier ||
      (namedBindings &&
        ts.isNamespaceImport(namedBindings) &&
        namedBindings.name.text === qualifier);
    if (!importsQualifier) continue;
    const moduleSymbol = checker.getSymbolAtLocation(statement.moduleSpecifier);
    const exported = moduleSymbol
      ? checker
          .getExportsOfModule(moduleSymbol)
          .find((candidate) => candidate.getName() === exportName)
      : undefined;
    if (exported) return targetFromSymbol(checker, exported);
  }
  throw new Error(`Cannot resolve excluded input ${qualifiedName}`);
}

function referencedSourceInterfaces(checker, source, typeNode) {
  const declarations = new Map();
  const visit = (node) => {
    if (ts.isTypeReferenceNode(node)) {
      const symbol = resolveAlias(checker, checker.getSymbolAtLocation(node.typeName));
      for (const declaration of symbol?.declarations ?? []) {
        if (ts.isInterfaceDeclaration(declaration) && declaration.getSourceFile() === source) {
          for (const identity of symbolDeclarationIdentities(checker, symbol)) {
            declarations.set(identity, declaration);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(typeNode);
  return [...new Set(declarations.values())];
}

function propertyContainsIndexedAccessTo(checker, property, target) {
  let found = false;
  const visit = (node) => {
    if (found) return;
    if (
      ts.isIndexedAccessTypeNode(node) &&
      isTargetType(checker, checker.getTypeAtLocation(node.objectType), target)
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  if (property.type) visit(property.type);
  return found;
}

function symbolsShareDeclarationIdentity(checker, left, right) {
  const rightIdentities = symbolDeclarationIdentities(checker, right);
  return [...symbolDeclarationIdentities(checker, left)].some((identity) =>
    rightIdentities.has(identity),
  );
}

function locateGenericAliasIndexedAccessMembers({ checker, descriptor, source }) {
  const { declaration: aliasDeclaration, symbol: aliasSymbol } = exportedTypeAlias(
    checker,
    source,
    descriptor.canonicalSymbol,
  );
  const excludedType = importedQualifiedTypeTarget(checker, source, descriptor.excludedInput);
  const interfaces = referencedSourceInterfaces(checker, source, aliasDeclaration.type);
  const matchingInterfaces = interfaces
    .map((declaration) => ({
      declaration,
      members: declaration.members.filter(
        (member) =>
          ts.isPropertySignature(member) &&
          propertyContainsIndexedAccessTo(checker, member, excludedType),
      ),
    }))
    .filter((candidate) => candidate.members.length > 0);
  if (matchingInterfaces.length === 0) {
    throw new Error(
      `Cannot find ${descriptor.excludedInput} indexed members in ${descriptor.canonicalSymbol}`,
    );
  }
  if (matchingInterfaces.length > 1) {
    throw new Error(
      `Cannot uniquely resolve the layout interface behind ${descriptor.canonicalSymbol}`,
    );
  }

  const aliasType = checker.getDeclaredTypeOfSymbol(aliasSymbol);
  const aliasProperties = checker.getPropertiesOfType(aliasType);
  for (const member of matchingInterfaces[0].members) {
    const memberSymbol = member.name && checker.getSymbolAtLocation(member.name);
    if (
      !memberSymbol ||
      !aliasProperties.some((property) =>
        symbolsShareDeclarationIdentity(checker, memberSymbol, property),
      )
    ) {
      throw new Error(
        `${descriptor.canonicalSymbol} does not retain every ${descriptor.excludedInput} indexed member`,
      );
    }
  }

  return {
    ...targetFromSymbol(checker, aliasSymbol),
    propertyName: undefined,
    declarationSources: new Set([normalizedDeclarationPath(source.fileName)]),
    preferDirectExport: true,
  };
}

function locateExportedAlias({ checker, descriptor, source }) {
  const declaration = source.statements.find(
    (statement) =>
      ts.isTypeAliasDeclaration(statement) && statement.name.text === descriptor.canonicalSymbol,
  );
  const symbol = declaration && checker.getSymbolAtLocation(declaration.name);
  if (
    !declaration ||
    !symbol ||
    !declaration.modifiers?.some(({ kind }) => kind === ts.SyntaxKind.ExportKeyword)
  ) {
    throw new Error(`Cannot find exported alias ${descriptor.canonicalSymbol}`);
  }
  return {
    ...targetFromSymbol(checker, symbol),
    propertyName: undefined,
    declarationSources: new Set([normalizedDeclarationPath(source.fileName)]),
    preferDirectExport: true,
  };
}

function locateExcludedType({ checker, program, descriptor, rootDirectory }) {
  const sourcePath = descriptor.canonicalEvidencePaths[0];
  const source = program.getSourceFile(path.join(rootDirectory, sourcePath));
  if (!source) throw new Error(`Missing canonical evidence source ${sourcePath}`);
  if (descriptor.targetKind === "generic-alias-indexed-access-members") {
    return locateGenericAliasIndexedAccessMembers({ checker, descriptor, source });
  }
  if (descriptor.targetKind === "exported-alias") {
    return locateExportedAlias({ checker, descriptor, source });
  }
  const [typeName, propertyName] = descriptor.canonicalSymbol.split(".");
  let property;
  const visit = (node) => {
    if (
      (ts.isInterfaceDeclaration(node) ||
        (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type))) &&
      node.name.text === typeName
    ) {
      const members = ts.isTypeAliasDeclaration(node) ? node.type.members : node.members;
      property = members.find(
        (member) => ts.isPropertySignature(member) && member.name.getText(source) === propertyName,
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!property?.type) {
    throw new Error(`Cannot find input ${descriptor.canonicalSymbol}`);
  }
  const targetKind = descriptor.targetKind ?? "union-member";
  let targetNode;
  if (targetKind === "union-member") {
    if (!ts.isUnionTypeNode(property.type)) {
      throw new Error(`Cannot find union input ${descriptor.canonicalSymbol}`);
    }
    targetNode = property.type.types.find((node) =>
      node.getText(source).includes(descriptor.excludedInput),
    );
  } else if (targetKind === "direct-aliased-reference") {
    if (
      !ts.isTypeReferenceNode(property.type) ||
      !property.type.getText(source).includes(descriptor.excludedInput)
    ) {
      throw new Error(`Cannot find direct aliased input ${descriptor.canonicalSymbol}`);
    }
    targetNode = property.type;
  } else {
    throw new Error(`Unknown contract-input target kind ${targetKind}`);
  }
  if (!targetNode)
    throw new Error(`Cannot find ${descriptor.excludedInput} in ${descriptor.canonicalSymbol}`);
  const type = checker.getTypeAtLocation(targetNode);
  if (!isSafeType(type)) throw new Error(`Cannot resolve ${descriptor.excludedInput} type`);
  const symbol =
    type.aliasSymbol ??
    type.symbol ??
    resolveAlias(
      checker,
      checker.getSymbolAtLocation(
        ts.isTypeReferenceNode(targetNode) ? targetNode.typeName : targetNode,
      ),
    );
  if (!symbol) throw new Error(`Cannot resolve ${descriptor.excludedInput} declaration`);
  const symbols = new Set([symbol, resolveAlias(checker, symbol)].filter(Boolean));
  const declarationIdentities = symbolDeclarationIdentities(checker, symbol);
  if (declarationIdentities.size === 0) {
    throw new Error(`Cannot resolve ${descriptor.excludedInput} declaration identity`);
  }
  return {
    propertyName,
    symbols,
    declarationIdentities,
  };
}

function sourcesMayReachTarget(program, target) {
  if (!target.declarationSources) return undefined;
  const reverse = new Map();
  for (const source of program.getSourceFiles()) {
    const addDependency = (dependency) => {
      const resolvedSource = dependency && program.getSourceFile(dependency);
      if (!resolvedSource) return;
      const dependents = reverse.get(resolvedSource.fileName) ?? new Set();
      dependents.add(source.fileName);
      reverse.set(resolvedSource.fileName, dependents);
    };
    for (const moduleSpecifier of source.imports) {
      const resolved = program.getResolvedModuleFromModuleSpecifier(
        moduleSpecifier,
        source,
      )?.resolvedModule;
      addDependency(resolved?.resolvedFileName);
    }
    for (const reference of source.referencedFiles) {
      addDependency(ts.resolveTripleslashReference(reference.fileName, source.fileName));
    }
    for (const reference of source.typeReferenceDirectives) {
      const resolved = program.getResolvedTypeReferenceDirectiveFromTypeReferenceDirective(
        reference,
        source,
      )?.resolvedTypeReferenceDirective;
      addDependency(resolved?.resolvedFileName);
    }
  }
  const queue = program
    .getSourceFiles()
    .filter((source) => target.declarationSources.has(normalizedDeclarationPath(source.fileName)))
    .map((source) => source.fileName);
  const reachable = new Set();
  for (let index = 0; index < queue.length; index++) {
    const source = queue[index];
    if (reachable.has(source)) continue;
    reachable.add(source);
    for (const dependent of reverse.get(source) ?? []) queue.push(dependent);
  }
  return reachable;
}

function diagnosticMessage(diagnostic) {
  return ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
}

function normalizeDiagnostic(diagnostic, rootDirectory) {
  return {
    code: diagnostic.code,
    file: diagnostic.file
      ? path.relative(rootDirectory, diagnostic.file.fileName).replaceAll("\\", "/")
      : null,
    start: diagnostic.start ?? null,
    length: diagnostic.length ?? null,
    message: diagnosticMessage(diagnostic).replace(/'[^']*\/node_modules\//g, "'<node_modules>/"),
  };
}

function assertProgramDiagnostics(program, rootDirectory, expectedHash) {
  const coreSources = program
    .getSourceFiles()
    .filter((source) =>
      source.fileName.replaceAll("\\", "/").includes("/static/app/components/core/"),
    );
  const diagnostics = [
    ...program.getOptionsDiagnostics(),
    ...program.getGlobalDiagnostics(),
    ...coreSources.flatMap((source) => program.getSyntacticDiagnostics(source)),
    ...coreSources.flatMap((source) => program.getSemanticDiagnostics(source)),
  ]
    .map((diagnostic) => normalizeDiagnostic(diagnostic, rootDirectory))
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  const hash = createHash("sha256").update(JSON.stringify(diagnostics)).digest("hex");
  if (expectedHash ? hash !== expectedHash : diagnostics.length > 0) {
    const details = process.env.PARITY_DEBUG_DIAGNOSTICS
      ? `\n${JSON.stringify(diagnostics, null, 2)}`
      : "";
    throw new Error(
      `Canonical TypeScript contract diagnostics differ from the pinned baseline (${hash})${details}`,
    );
  }
}

function createProgram(rootDirectory, moduleNames, expectedDiagnosticHash) {
  const config = ts.readConfigFile(path.join(rootDirectory, "tsconfig.json"), ts.sys.readFile);
  if (config.error) {
    throw new Error(`Cannot read canonical TypeScript config: ${diagnosticMessage(config.error)}`);
  }
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, rootDirectory);
  if (parsed.errors.length > 0) {
    throw new Error(
      `Cannot parse canonical TypeScript config: ${parsed.errors.map(diagnosticMessage).join("; ")}`,
    );
  }
  const rootNames = moduleNames.map((name) => {
    const directory = path.join(rootDirectory, "static/app/components/core", name);
    return ts.sys.fileExists(path.join(directory, "index.tsx"))
      ? path.join(directory, "index.tsx")
      : path.join(directory, "index.ts");
  });
  const program = ts.createProgram({ rootNames, options: { ...parsed.options, noEmit: true } });
  assertProgramDiagnostics(program, rootDirectory, expectedDiagnosticHash);
  return program;
}

function propertyType(checker, property) {
  const declaration = property.valueDeclaration ?? property.declarations?.[0];
  if (!declaration) return undefined;
  try {
    return checker.getTypeOfSymbolAtLocation(property, declaration);
  } catch {
    return undefined;
  }
}

function isCoreType(checker, type) {
  const signatures = [
    ...checker.getSignaturesOfType(type, ts.SignatureKind.Call),
    ...checker.getSignaturesOfType(type, ts.SignatureKind.Construct),
  ];
  return [type.symbol, type.aliasSymbol]
    .flatMap((symbol) => symbol?.declarations ?? [])
    .concat(signatures.flatMap((signature) => signature.declaration ?? []))
    .some((declaration) =>
      declaration
        .getSourceFile()
        .fileName.replaceAll("\\", "/")
        .includes("/static/app/components/core/"),
    );
}

function hasCoreDeclaration(symbol) {
  return (symbol.declarations ?? []).some((declaration) =>
    declaration
      .getSourceFile()
      .fileName.replaceAll("\\", "/")
      .includes("/static/app/components/core/"),
  );
}

function typeReachesTarget({ checker, type, target, trace, visited, budget, mode = "input" }) {
  const queue = [{ type, trace, mode, depth: 0 }];
  let index = 0;
  while (index < queue.length && budget.remaining-- > 0) {
    const current = queue[index++];
    if (current.depth > 16 || !isSafeType(current.type)) continue;
    const key = `${stableTypeKey(current.type)}:${current.mode}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (target.propertyName === undefined && isTargetType(checker, current.type, target)) {
      return current.trace;
    }

    const properties = checker.getPropertiesOfType(current.type);
    for (const property of properties) {
      const memberType = propertyType(checker, property);
      if (!memberType) continue;
      const propertyTrace = `${current.trace} > .${property.getName()}`;
      const match =
        current.mode === "input" && property.getName() === target.propertyName
          ? targetMemberTrace(checker, memberType, target, propertyTrace)
          : undefined;
      if (match) return match;
    }

    const edges = [];
    if (current.type.isUnionOrIntersection()) {
      for (const member of current.type.types) {
        edges.push({ label: "union", type: member, mode: current.mode, priority: 8 });
      }
    }
    const typeArguments =
      checker.getTypeArguments(current.type) ?? current.type.aliasTypeArguments ?? [];
    for (const [argumentIndex, argument] of typeArguments.entries()) {
      edges.push({
        label: `type argument ${argumentIndex}`,
        type: argument,
        mode: current.mode,
        priority: 7,
      });
    }
    if (current.type.flags & ts.TypeFlags.TypeParameter) {
      const constraint = checker.getBaseConstraintOfType(current.type);
      if (constraint)
        edges.push({ label: "constraint", type: constraint, mode: current.mode, priority: 7 });
      const defaultType = current.type.getDefault?.();
      if (defaultType)
        edges.push({ label: "default", type: defaultType, mode: current.mode, priority: 7 });
    }
    const signatures = [
      ...checker.getSignaturesOfType(current.type, ts.SignatureKind.Call),
      ...checker.getSignaturesOfType(current.type, ts.SignatureKind.Construct),
    ];
    for (const signature of signatures) {
      for (const parameter of signature.getParameters()) {
        const parameterType = propertyType(checker, parameter);
        if (parameterType)
          edges.push({
            label: `parameter ${parameter.getName()}`,
            type: parameterType,
            mode: "input",
            priority: 8,
          });
      }
      for (const typeParameter of signature.getTypeParameters?.() ?? []) {
        const constraint = checker.getBaseConstraintOfType(typeParameter);
        if (constraint)
          edges.push({
            label: `constraint ${typeParameter.symbol?.getName() ?? ""}`,
            type: constraint,
            mode: "input",
            priority: 7,
          });
        const defaultType = typeParameter.getDefault?.();
        if (defaultType)
          edges.push({
            label: `default ${typeParameter.symbol?.getName() ?? ""}`,
            type: defaultType,
            mode: "input",
            priority: 7,
          });
      }
      try {
        edges.push({
          label: "return",
          type: signature.getReturnType(),
          mode: "output",
          priority: 6,
        });
      } catch {}
    }
    const currentIsCoreType = isCoreType(checker, current.type);
    for (const property of properties) {
      const memberType = propertyType(checker, property);
      if (!memberType) continue;
      const memberIsCoreType = isCoreType(checker, memberType);
      if (!currentIsCoreType && !memberIsCoreType && !hasCoreDeclaration(property)) continue;
      const isCallable = checker.getSignaturesOfType(memberType, ts.SignatureKind.Call).length > 0;
      edges.push({
        label: `.${property.getName()}`,
        type: memberType,
        mode: current.mode,
        priority: memberIsCoreType && isCallable ? 7 : memberIsCoreType ? 5 : 3,
      });
    }
    for (const base of current.type.getBaseTypes?.() ?? []) {
      edges.push({ label: "base", type: base, mode: current.mode, priority: 5 });
    }
    edges.sort((left, right) => right.priority - left.priority);
    for (const edge of edges) {
      queue.push({
        type: edge.type,
        trace: `${current.trace} > ${edge.label}`,
        mode: edge.mode,
        depth: current.depth + 1,
      });
    }
  }
  return undefined;
}

export function collectExcludedContractInputClosure({
  rootDirectory,
  moduleNames,
  descriptors = excludedContractInputDescriptors,
  expectedDiagnosticHash,
}) {
  const program = createProgram(rootDirectory, moduleNames, expectedDiagnosticHash);
  const checker = program.getTypeChecker();
  return descriptors.map((descriptor) => {
    const target = locateExcludedType({ checker, program, descriptor, rootDirectory });
    const evidence = [];
    const candidates = sourcesMayReachTarget(program, target);
    for (const moduleName of moduleNames) {
      const moduleDirectory = path.join(rootDirectory, "static/app/components/core", moduleName);
      const source = program.getSourceFile(
        ts.sys.fileExists(path.join(moduleDirectory, "index.tsx"))
          ? path.join(moduleDirectory, "index.tsx")
          : path.join(moduleDirectory, "index.ts"),
      );
      const moduleSymbol = source && checker.getSymbolAtLocation(source);
      if (!moduleSymbol) continue;
      if (candidates && !candidates.has(source.fileName)) continue;
      const exports = [...checker.getExportsOfModule(moduleSymbol)];
      if (target.preferDirectExport) {
        exports.sort((left, right) => {
          const leftIsTarget = isTargetSymbol(checker, left, target);
          const rightIsTarget = isTargetSymbol(checker, right, target);
          return Number(rightIsTarget) - Number(leftIsTarget);
        });
      }
      for (const exported of exports) {
        if (target.preferDirectExport && isTargetSymbol(checker, exported, target)) {
          evidence.push({
            moduleName,
            exportName: exported.getName(),
            trace: `${moduleName}.${exported.getName()}`,
          });
          break;
        }
        const exportedSymbol = resolveAlias(checker, exported);
        const declaration =
          exportedSymbol.valueDeclaration ?? exportedSymbol.declarations?.[0] ?? source;
        const isTypeExport = Boolean(exportedSymbol.flags & ts.SymbolFlags.Type);
        const exportedType = isTypeExport
          ? checker.getDeclaredTypeOfSymbol(exportedSymbol)
          : checker.getTypeOfSymbolAtLocation(exportedSymbol, declaration);
        if (!isSafeType(exportedType)) continue;
        const trace = typeReachesTarget({
          checker,
          type: exportedType,
          target,
          trace: `${moduleName}.${exported.getName()}`,
          visited: new Set(),
          budget: { remaining: target.propertyName === undefined ? 500 : 20000 },
          mode: isTypeExport ? "input" : "output",
        });
        if (trace) {
          evidence.push({ moduleName, exportName: exported.getName(), trace });
          break;
        }
      }
    }
    return {
      ...descriptor,
      affectedModules: evidence.map((item) => item.moduleName).sort(),
      evidence,
    };
  });
}

async function dependencyNodeModulesPath(dependencyRepository) {
  const nodeModulesPath = path.join(dependencyRepository, "node_modules");
  try {
    if (!(await stat(nodeModulesPath)).isDirectory()) throw new Error();
  } catch {
    throw new Error(`Missing dependency node_modules at ${nodeModulesPath}`);
  }
  return nodeModulesPath;
}

function registeredWorktrees(canonicalRepository) {
  return execFileSync("git", ["-C", canonicalRepository, "worktree", "list", "--porcelain"], {
    encoding: "utf8",
  })
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length));
}

async function cleanupPinnedArchive({ canonicalRepository, checkout, temporaryRoot }) {
  const cleanupErrors = [];
  await unlink(path.join(checkout, "node_modules")).catch((error) => {
    if (error.code !== "ENOENT") cleanupErrors.push(error);
  });

  let removalError;
  try {
    execFileSync("git", ["-C", canonicalRepository, "worktree", "remove", "--force", checkout], {
      stdio: "ignore",
    });
  } catch (error) {
    removalError = error;
  }

  await rm(temporaryRoot, { recursive: true, force: true }).catch((error) =>
    cleanupErrors.push(error),
  );
  try {
    if (registeredWorktrees(canonicalRepository).includes(checkout)) {
      cleanupErrors.push(
        removalError ?? new Error(`Temporary worktree remains registered at ${checkout}`),
      );
    }
  } catch (error) {
    cleanupErrors.push(error);
  }

  if (cleanupErrors.length > 0) {
    throw new AggregateError(cleanupErrors, `Cannot clean temporary worktree ${checkout}`);
  }
}

async function withPinnedArchive(callback, canonicalRepository, dependencyRepository) {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "scrapscn-sentry-contract-"));
  const checkout = path.join(temporaryRoot, "checkout");
  let primaryError;
  try {
    execFileSync(
      "git",
      [
        "-C",
        canonicalRepository,
        "worktree",
        "add",
        "--no-checkout",
        "--detach",
        checkout,
        CANONICAL_COMMIT,
      ],
      { stdio: "ignore" },
    );
    execFileSync("git", ["-C", checkout, "checkout"], { stdio: "ignore" });
    await symlink(
      await dependencyNodeModulesPath(dependencyRepository),
      path.join(checkout, "node_modules"),
    );
    return await callback(checkout);
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    try {
      await cleanupPinnedArchive({ canonicalRepository, checkout, temporaryRoot });
    } catch (cleanupError) {
      if (!primaryError) throw cleanupError;
      if (primaryError instanceof Error && primaryError.cause === undefined) {
        primaryError.cause = cleanupError;
      }
    }
  }
}

export async function collectPinnedExcludedContractInputClosure({
  canonicalRepository = path.resolve("..", "sentry"),
  dependencyRepository = canonicalRepository,
  moduleNames,
  descriptors = excludedContractInputDescriptors,
}) {
  return withPinnedArchive(
    (rootDirectory) =>
      collectExcludedContractInputClosure({
        rootDirectory,
        moduleNames,
        descriptors,
        expectedDiagnosticHash: EXPECTED_PINNED_CORE_DIAGNOSTIC_HASH,
      }),
    canonicalRepository,
    dependencyRepository,
  );
}

export function contractInputsForModule(descriptors, moduleName) {
  return descriptors
    .filter((descriptor) => descriptor.affectedModules.includes(moduleName))
    .map(({ id }) => id)
    .sort();
}
