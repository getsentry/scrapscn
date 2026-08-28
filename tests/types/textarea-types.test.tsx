import { TextArea, type TextAreaProps } from "@/components/ui/textarea";

const props: TextAreaProps = {
  autosize: true,
  maxRows: 8,
  monospace: true,
  rows: 3,
  size: "sm",
};

<TextArea {...props} />;
<TextArea disabled readOnly size="md" />;
<TextArea size="xs" style={{ color: "red" }} />;

// @ts-expect-error The canonical form-size set has no large size.
<TextArea size="lg" />;
// @ts-expect-error Canonical onResize is reserved by react-textarea-autosize.
<TextArea onResize={() => undefined} />;
