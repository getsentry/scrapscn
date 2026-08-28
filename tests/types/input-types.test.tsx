import { createRef } from "react";

import {
  Input,
  InputGroup,
  NumberDragInput,
  NumberInput,
  OTPInput,
  useAutosizeInput,
  type InputProps,
  type InputStylesProps,
} from "@/components/ui/input";

const ref = createRef<HTMLInputElement>();
const styles: InputStylesProps = {
  monospace: true,
  nativeSize: 20,
  readOnly: true,
  size: "sm",
  type: "search",
};
const props: InputProps = { ...styles, ref };

<Input {...props} aria-label="Search" />;
<InputGroup>
  <InputGroup.LeadingItems disablePointerEvents>prefix</InputGroup.LeadingItems>
  <InputGroup.Input aria-label="Query" size="xs" />
  <InputGroup.TrailingItems>suffix</InputGroup.TrailingItems>
</InputGroup>;
<InputGroup>
  <InputGroup.TextArea aria-label="Description" rows={3} />
</InputGroup>;
<NumberInput defaultValue={5} max={10} min={0} onChange={(value) => value.toFixed()} />;
<NumberDragInput axis="y" defaultValue={5} shiftKeyMultiplier={10} step={2} />;
<OTPInput format="000-000" onComplete={(value) => value.toUpperCase()} />;
<OTPInput format="AAA" onComplete={(value) => value.toUpperCase()} uppercase />;

function AutosizeUsage() {
  const autosizeRef = useAutosizeInput({ enabled: true, value: "query" });
  return <Input aria-label="Autosize" ref={autosizeRef} />;
}

<AutosizeUsage />;

// @ts-expect-error Native size is renamed to nativeSize.
<Input size={20} />;
// @ts-expect-error The canonical form-size set has no large size.
<Input size="lg" />;
// @ts-expect-error NumberInput onChange receives a number.
<NumberInput onChange={(event) => event.currentTarget} />;
// @ts-expect-error OTP formats cannot mix numeric and alphanumeric tokens.
<OTPInput format="0A0" onComplete={() => undefined} />;
// @ts-expect-error OTP separators must appear between tokens.
<OTPInput format="-000" onComplete={() => undefined} />;
