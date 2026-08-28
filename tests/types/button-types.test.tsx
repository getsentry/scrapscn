import {
  Button,
  ButtonBar,
  LinkButton,
  type ButtonProps,
  type LinkButtonProps,
} from "@/components/ui/button";

const buttonProps: ButtonProps = {
  children: "Save",
  size: "zero",
  tooltipProps: {
    overlayStyle: { padding: 4 },
    title: "Save changes",
  },
  variant: "primary",
};
const emotionLikeSerializedStyles = {
  name: "button-tooltip",
  styles: "padding:4px;",
};
const invalidButtonTooltip: ButtonProps = {
  children: "Save",
  tooltipProps: {
    // @ts-expect-error SerializedStyles objects require the excluded Emotion runtime.
    overlayStyle: emotionLikeSerializedStyles,
  },
};
void invalidButtonTooltip;
<Button {...buttonProps} />;
<Button aria-label="Add" icon={<svg />} size="xs" variant="transparent" />;
<ButtonBar orientation="vertical" size="sm">
  <Button>One</Button>
</ButtonBar>;

const internal: LinkButtonProps = { children: "Issues", to: "/issues/" };
const external: LinkButtonProps = {
  children: "Docs",
  external: true,
  href: "https://docs.sentry.io",
};
<LinkButton {...internal} />;
<LinkButton {...external} />;

// @ts-expect-error Icon-only buttons require an accessible name.
<Button icon={<svg />} />;
// @ts-expect-error The canonical size set has no `default` alias.
<Button size="default">Save</Button>;
// @ts-expect-error The canonical variant is `danger`, not `destructive`.
<Button variant="destructive">Delete</Button>;
<LinkButton href="/docs" to="/docs">
  Docs
</LinkButton>;
