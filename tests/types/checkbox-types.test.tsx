import { createRef } from "react";

import { Checkbox, type CheckboxProps } from "@/components/ui/checkbox";

export function CheckboxTypeEvidence() {
  const ref = createRef<HTMLInputElement>();
  const props = {
    "aria-label": "Mixed setting",
    checked: "indeterminate",
    disabled: false,
    name: "setting",
    readOnly: false,
    ref,
    size: "md",
    value: "enabled",
  } satisfies CheckboxProps;

  return <Checkbox {...props} />;
}
