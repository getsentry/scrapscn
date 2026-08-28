import { createRef, type ComponentProps } from "react";

import { Radio } from "@/components/ui/radio";

type RadioProps = ComponentProps<typeof Radio>;

export function RadioTypeEvidence() {
  const ref = createRef<HTMLInputElement>();
  const props = {
    "aria-label": "Log level",
    checked: true,
    disabled: false,
    name: "level",
    onChange: () => {},
    ref,
    size: "xs",
    value: "warning",
  } satisfies RadioProps;

  return <Radio {...props} />;
}

// @ts-expect-error The native type is fixed to radio.
const invalidType = <Radio type="checkbox" />;
// @ts-expect-error Radio no longer accepts the native size attribute.
const invalidNativeSize = <Radio nativeSize={7} />;

void invalidType;
void invalidNativeSize;
