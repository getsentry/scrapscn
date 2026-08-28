import { createRef } from "react";

import { Switch, type SwitchProps } from "@/components/ui/switch";

export function SwitchTypeEvidence() {
  const ref = createRef<HTMLInputElement>();
  const props = {
    "aria-label": "Notifications",
    checked: true,
    disabled: false,
    form: "settings",
    name: "notifications",
    onChange: () => undefined,
    ref,
    required: true,
    size: "lg",
    value: "enabled",
  } satisfies SwitchProps;
  return <Switch {...props} />;
}

// @ts-expect-error Regular Scraps Switch does not expose Base UI's size vocabulary.
const invalidSize: SwitchProps = { size: "default" };
// @ts-expect-error The canonical public API omits onClick.
const invalidClick: SwitchProps = { onClick: () => undefined };
void invalidSize;
void invalidClick;
