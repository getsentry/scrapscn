import { spawnSync } from "node:child_process"
import { pathToFileURL } from "node:url"
import ts from "typescript"

const SIZES = ["xs", "sm", "md"]
const CHECKED_VALUES = ["False", "True", "indeterminate"]
const STATES = ["Default", "Hover", "Active", "disabled", "Focused"]
const REVIEW_STATES = new Set(["Default", "disabled"])
const CHECKBOX_PROP_NAMES = new Set(["size", "checked", "disabled"])

const expectedKeys = SIZES.flatMap((size) =>
  CHECKED_VALUES.flatMap((checked) =>
    STATES.map((state) => `${size}|${checked}|${state}`)
  )
)

function combinationKey(label) {
  const entries = label.split(", ").map((part) => {
    const separator = part.indexOf("=")
    return [part.slice(0, separator), part.slice(separator + 1)]
  })
  const propertyNames = entries.map(([name]) => name).sort()
  if (propertyNames.join("|") !== "checked|size|state") {
    throw new Error(`Figma Checkbox schema contains unexpected properties: ${propertyNames.join(", ")}`)
  }
  const properties = Object.fromEntries(entries)
  return `${properties.size}|${properties.checked}|${properties.state}`
}

function inspectCheckboxSnippet(snippet) {
  const source = ts.createSourceFile("checkbox-preview.tsx", snippet, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  if (source.parseDiagnostics.length) {
    throw new Error("Figma Checkbox preview contains invalid syntax")
  }
  let importsLocalCheckbox = false
  let importsMonolithCheckbox = false
  let checkboxRenderCount = 0
  let checkboxProps = new Map()
  let checkboxPropsAreExact = true
  let checkboxBindingIsShadowed = false

  function bindsCheckbox(name) {
    if (!name) return false
    if (ts.isIdentifier(name)) return name.text === "Checkbox"
    if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      return name.elements.some((element) => ts.isBindingElement(element) && bindsCheckbox(element.name))
    }
    return false
  }

  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue
    const moduleName = statement.moduleSpecifier.text
    if (moduleName === "@sentry/scraps/checkbox") importsMonolithCheckbox = true
    if (moduleName !== "@/components/ui/checkbox") continue

    if (statement.importClause?.isTypeOnly) continue
    const bindings = statement.importClause?.namedBindings
    if (!bindings || !ts.isNamedImports(bindings)) continue
    importsLocalCheckbox = bindings.elements.some((element) => {
      const importedName = element.propertyName?.text ?? element.name.text
      return !element.isTypeOnly && importedName === "Checkbox" && element.name.text === "Checkbox"
    })
  }

  function visit(node) {
    if (
      (ts.isVariableDeclaration(node) ||
        ts.isParameter(node) ||
        ts.isFunctionDeclaration(node) ||
        ts.isFunctionExpression(node) ||
        ts.isClassDeclaration(node) ||
        ts.isClassExpression(node) ||
        ts.isEnumDeclaration(node) ||
        ts.isCatchClause(node)) &&
      bindsCheckbox(ts.isCatchClause(node) ? node.variableDeclaration?.name : node.name)
    ) {
      checkboxBindingIsShadowed = true
    }
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ts.isIdentifier(node.tagName) &&
      node.tagName.text === "Checkbox"
    ) {
      checkboxRenderCount++
      checkboxProps = new Map()
      for (const attribute of node.attributes.properties) {
        if (!ts.isJsxAttribute(attribute)) {
          checkboxPropsAreExact = false
          continue
        }
        const name = attribute.name.text
        if (!CHECKBOX_PROP_NAMES.has(name)) {
          checkboxPropsAreExact = false
          continue
        }
        if (checkboxProps.has(name)) {
          checkboxPropsAreExact = false
          continue
        }
        if (!attribute.initializer) {
          checkboxProps.set(name, true)
          continue
        }
        if (ts.isStringLiteral(attribute.initializer)) {
          checkboxProps.set(name, attribute.initializer.text)
          continue
        }
        if (ts.isJsxExpression(attribute.initializer)) {
          if (attribute.initializer.expression?.kind === ts.SyntaxKind.TrueKeyword) {
            checkboxProps.set(name, true)
            continue
          }
          if (attribute.initializer.expression?.kind === ts.SyntaxKind.FalseKeyword) {
            checkboxProps.set(name, false)
            continue
          }
        }
        checkboxPropsAreExact = false
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(source)

  return {
    checkboxBindingIsShadowed,
    checkboxProps,
    checkboxPropsAreExact,
    checkboxRenderCount,
    importsLocalCheckbox,
    importsMonolithCheckbox,
  }
}

export function validateCheckboxPreviews(previews) {
  if (!Array.isArray(previews)) throw new Error("Figma preview returned invalid JSON")

  const byKey = new Map()
  for (const preview of previews) {
    if (!preview.propertyCombinationLabel) {
      throw new Error("Figma preview did not return Checkbox property labels")
    }
    const key = combinationKey(preview.propertyCombinationLabel)
    if (byKey.has(key)) throw new Error(`Figma preview returned duplicate combination ${key}`)
    byKey.set(key, preview)
  }

  const missing = expectedKeys.filter((key) => !byKey.has(key))
  const unexpected = [...byKey.keys()].filter((key) => !expectedKeys.includes(key))
  if (missing.length || unexpected.length) {
    throw new Error(`Figma Checkbox schema mismatch. Missing: ${missing.join(", ") || "none"}. Unexpected: ${unexpected.join(", ") || "none"}.`)
  }

  const allPreviews = expectedKeys.map((key) => byKey.get(key))

  for (const preview of allPreviews) {
    if (preview.success !== true) {
      throw new Error(`Figma Checkbox preview failed for ${preview.propertyCombinationLabel}`)
    }
    const snippet = inspectCheckboxSnippet(preview.snippet ?? "")
    if (
      !snippet.importsLocalCheckbox ||
      snippet.importsMonolithCheckbox ||
      snippet.checkboxBindingIsShadowed ||
      snippet.checkboxRenderCount !== 1
    ) {
      throw new Error(`Figma Checkbox preview used the wrong component for ${preview.propertyCombinationLabel}`)
    }

    const [size, checked, state] = combinationKey(preview.propertyCombinationLabel).split("|")
    const expectedChecked = checked === "True" ? true : checked === "indeterminate" ? "indeterminate" : undefined
    const expectedDisabled = state === "disabled" ? true : undefined
    const matchesProp = (name, expected) =>
      expected === undefined ? !snippet.checkboxProps.has(name) : snippet.checkboxProps.get(name) === expected
    if (
      !snippet.checkboxPropsAreExact ||
      !matchesProp("size", size) ||
      !matchesProp("checked", expectedChecked) ||
      !matchesProp("disabled", expectedDisabled)
    ) {
      throw new Error(`Figma Checkbox preview mapped the wrong props for ${preview.propertyCombinationLabel}`)
    }
  }

  return expectedKeys.filter((key) => REVIEW_STATES.has(key.split("|")[2])).length
}

function run() {
  if (!process.env.FIGMA_ACCESS_TOKEN) {
    throw new Error("FIGMA_ACCESS_TOKEN is required for the authenticated Figma preview check")
  }

  const result = spawnSync("pnpm", [
    "exec",
    "figma",
    "connect",
    "preview",
    "src/components/ui/checkbox.figma.ts",
    "--all",
    "--max-combinations",
    String(expectedKeys.length + 1),
    "--output",
    "json",
    "--exit-on-unreadable-files",
    "--skip-update-check",
  ], { encoding: "utf8", env: process.env })

  if (result.status !== 0) {
    process.stderr.write(result.stderr)
    process.stdout.write(result.stdout)
    process.exit(result.status ?? 1)
  }

  const jsonStart = result.stdout.indexOf("[")
  if (jsonStart < 0) throw new Error("Figma preview did not return JSON results")
  const count = validateCheckboxPreviews(JSON.parse(result.stdout.slice(jsonStart)))
  process.stdout.write(`Validated all ${count} Figma Checkbox review combinations.\n`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) run()
