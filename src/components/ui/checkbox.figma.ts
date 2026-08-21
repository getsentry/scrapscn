// url=https://www.figma.com/design/eTJz6aPgudMY9E6mzyZU0B/%F0%9F%90%A6-Components?node-id=3481-4211&m=draw&t=ITviPfKTjIMGFJOi-11
// component=Checkbox

import figma from "figma"

const size = figma.selectedInstance.getEnum("size", {
  xs: "xs",
  sm: "sm",
  md: "md",
})
const checked = figma.selectedInstance.getEnum("checked", {
  true: true,
  false: false,
  indeterminate: "indeterminate",
})
const disabled = figma.selectedInstance.getEnum("state", {
  default: false,
  disabled: true,
})

const checkboxCodeConnect = {
  id: "Checkbox",
  imports: ['import { Checkbox } from "@/components/ui/checkbox"'],
  example: figma.code`<Checkbox${figma.helpers.react.renderProp(
    "size",
    size
  )}${figma.helpers.react.renderProp(
    "checked",
    checked
  )}${figma.helpers.react.renderProp("disabled", disabled)} />`,
}

export default checkboxCodeConnect
