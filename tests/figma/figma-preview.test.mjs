import assert from "node:assert/strict"
import test from "node:test"
import { validateCheckboxPreviews } from "../../scripts/figma-preview.mjs"

const sizes = ["xs", "sm", "md"]
const checkedValues = ["False", "True", "indeterminate"]
const states = ["Default", "Hover", "Active", "disabled", "Focused"]

function previews() {
  return sizes.flatMap((size) =>
    checkedValues.flatMap((checked) =>
      states.map((state) => {
        const props = [`size="${size}"`]
        if (checked === "True") props.push("checked")
        if (checked === "indeterminate") props.push('checked="indeterminate"')
        if (state === "disabled") props.push("disabled")
        return {
          propertyCombinationLabel: `size=${size}, checked=${checked}, state=${state}`,
          snippet: `import { Checkbox } from "@/components/ui/checkbox";\n<Checkbox ${props.join(" ")} />`,
          success: true,
        }
      })
    )
  )
}

test("validates the exact Checkbox schema and 18 review combinations", () => {
  assert.equal(validateCheckboxPreviews(previews()), 18)
})

test("rejects a default render caused by an unavailable property schema", () => {
  assert.throws(
    () => validateCheckboxPreviews([{ snippet: "<Checkbox />", success: true }]),
    /did not return Checkbox property labels/
  )
})

test("rejects invalid or missing Figma property values", () => {
  const results = previews()
  results[0].propertyCombinationLabel = "size=invalid, checked=False, state=Default"
  assert.throws(() => validateCheckboxPreviews(results), /schema mismatch/)
})

test("rejects unexpected Figma properties", () => {
  const results = previews()
  results[0].propertyCombinationLabel += ", tone=standard"
  assert.throws(() => validateCheckboxPreviews(results), /unexpected properties/)
})

test("rejects duplicate Figma combinations", () => {
  const results = previews()
  results[1].propertyCombinationLabel = results[0].propertyCombinationLabel
  assert.throws(() => validateCheckboxPreviews(results), /duplicate combination/)
})

test("rejects a failed public review combination", () => {
  const results = previews()
  results[0].success = false
  assert.throws(() => validateCheckboxPreviews(results), /preview failed/)
})

test("rejects a successful preview that uses the monolith component", () => {
  const results = previews()
  results[0].snippet = 'import { Checkbox } from "@sentry/scraps/checkbox";\n<Checkbox />'
  assert.throws(() => validateCheckboxPreviews(results), /used the wrong component/)
})

test("rejects a mixed local and monolith Checkbox snippet", () => {
  const results = previews()
  results[0].snippet = [
    'import { Checkbox } from "@/components/ui/checkbox";',
    'import "@sentry/scraps/checkbox";',
    "<Checkbox />",
  ].join("\n")
  assert.throws(() => validateCheckboxPreviews(results), /used the wrong component/)
})

test("rejects commented imports and JSX", () => {
  const results = previews()
  results[0].snippet = '// import { Checkbox } from "@/components/ui/checkbox";\n// <Checkbox />'
  assert.throws(() => validateCheckboxPreviews(results), /used the wrong component/)
})

test("rejects a type-only local Checkbox import", () => {
  const results = previews()
  results[0].snippet = 'import type { Checkbox } from "@/components/ui/checkbox";\n<Checkbox />'
  assert.throws(() => validateCheckboxPreviews(results), /used the wrong component/)
})

test("rejects an element-level type-only Checkbox import", () => {
  const results = previews()
  results[0].snippet = 'import { type Checkbox } from "@/components/ui/checkbox";\n<Checkbox />'
  assert.throws(() => validateCheckboxPreviews(results), /used the wrong component/)
})

test("rejects a side-effect-only local Checkbox import", () => {
  const results = previews()
  results[0].snippet = 'import "@/components/ui/checkbox";\n<Checkbox />'
  assert.throws(() => validateCheckboxPreviews(results), /used the wrong component/)
})

test("rejects a syntactically invalid Checkbox snippet", () => {
  const results = previews()
  results[0].snippet = 'import { Checkbox Checkbox } from "@/components/ui/checkbox";\n<Checkbox />'
  assert.throws(() => validateCheckboxPreviews(results), /invalid syntax/)
})

test("rejects an incorrectly mapped Checkbox size", () => {
  const results = previews()
  results[0].snippet = results[0].snippet.replace('size="xs"', 'size="sm"')
  assert.throws(() => validateCheckboxPreviews(results), /mapped the wrong props/)
})

test("rejects an incorrectly mapped Checkbox checked state", () => {
  const results = previews()
  const checked = results.find((result) => result.propertyCombinationLabel.includes("checked=True, state=Default"))
  checked.snippet = checked.snippet.replace(" checked", "")
  assert.throws(() => validateCheckboxPreviews(results), /mapped the wrong props/)
})

test("rejects an incorrectly mapped Checkbox disabled state", () => {
  const results = previews()
  const disabled = results.find((result) => result.propertyCombinationLabel.includes("state=disabled"))
  disabled.snippet = disabled.snippet.replace(" disabled", "")
  assert.throws(() => validateCheckboxPreviews(results), /mapped the wrong props/)
})

test("rejects a public prop on a design-only interaction state", () => {
  const results = previews()
  const focused = results.find((result) => result.propertyCombinationLabel.includes("state=Focused"))
  focused.snippet = focused.snippet.replace(" />", " disabled />")
  assert.throws(() => validateCheckboxPreviews(results), /mapped the wrong props/)
})

test("rejects unreadable Checkbox prop expressions", () => {
  const results = previews()
  results[0].snippet = results[0].snippet.replace(" />", " checked={undefined} disabled={null} />")
  assert.throws(() => validateCheckboxPreviews(results), /mapped the wrong props/)
})

test("rejects spread Checkbox props", () => {
  const results = previews()
  results[0].snippet = results[0].snippet.replace(" />", ' {...{ checked: true, size: "md" }} />')
  assert.throws(() => validateCheckboxPreviews(results), /mapped the wrong props/)
})

test("rejects duplicate Checkbox props", () => {
  const results = previews()
  results[0].snippet = results[0].snippet.replace(" />", ' size="md" />')
  assert.throws(() => validateCheckboxPreviews(results), /mapped the wrong props/)
})

test("rejects extra Checkbox props", () => {
  const results = previews()
  results[0].snippet = results[0].snippet.replace(" />", " onClick={() => undefined} />")
  assert.throws(() => validateCheckboxPreviews(results), /mapped the wrong props/)
})

test("rejects multiple rendered Checkboxes", () => {
  const results = previews()
  const [importLine, checkbox] = results[0].snippet.split("\n")
  results[0].snippet = `${importLine}\n<>${checkbox}${checkbox}</>`
  assert.throws(() => validateCheckboxPreviews(results), /used the wrong component/)
})

test("rejects a declaration that shadows the imported Checkbox", () => {
  const results = previews()
  const [importLine, checkbox] = results[0].snippet.split("\n")
  results[0].snippet = `${importLine}\n{ const Checkbox = "input"; ${checkbox} }`
  assert.throws(() => validateCheckboxPreviews(results), /used the wrong component/)
})
