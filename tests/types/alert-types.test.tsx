import { Alert, AlertLink, type AlertProps } from "../../src/components/ui/alert";

const props: AlertProps = {
  variant: "warning",
  expand: "Details",
  handleExpandChange: () => undefined,
};

<Alert {...props}>Message</Alert>;
<Alert variant="info" defaultExpanded showIcon={false} system />;
<Alert.Container>
  <Alert variant="muted">Message</Alert>
</Alert.Container>;
<Alert.Button variant="danger">Delete</Alert.Button>;
const canonicalSerializedStyles = { name: "alert", styles: "color:red;" };
<Alert.Button
  tooltipProps={{
    title: "Delete",
    // @ts-expect-error Emotion SerializedStyles is an excluded portable input.
    overlayStyle: canonicalSerializedStyles,
  }}
>
  Delete
</Alert.Button>;
<AlertLink variant="info" to="/settings">
  Internal
</AlertLink>;
<AlertLink variant="success" href="https://example.com" openInNewTab>
  External
</AlertLink>;
<AlertLink variant="warning" onClick={() => undefined}>
  Manual
</AlertLink>;

// @ts-expect-error variant is required
<Alert>Message</Alert>;
// @ts-expect-error the canonical callback is handleExpandChange
<Alert variant="info" onExpandChange={() => undefined} />;
// @ts-expect-error external links require openInNewTab
<AlertLink variant="info" href="https://example.com">
  External
</AlertLink>;
// @ts-expect-error link destinations are mutually exclusive
<AlertLink variant="info" href="https://example.com" openInNewTab to="/settings" />;
// @ts-expect-error Alert.Button owns size
<Alert.Button size="md" variant="danger">
  Delete
</Alert.Button>;
