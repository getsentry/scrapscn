import { serializeStyles, type SerializedStyles } from "@emotion/serialize";

export interface KbdStyleTheme {
  border: { md: string; xl: string };
  font: {
    family: { mono: string };
    size: { sm: string };
    weight: { sans: { medium: number } };
  };
  radius: { sm: string };
  space: { xs: string };
  tokens: {
    background: { primary: string; secondary: string };
    border: { primary: string };
    content: { primary: string; secondary: string };
  };
}

export function kbdStyles(
  theme: KbdStyleTheme,
  variant?: "embossed" | "debossed"
): SerializedStyles {
  const debossed = variant === "debossed";
  return serializeStyles([
    [
      "margin:0",
      `padding:0 ${theme.space.xs}`,
      "height:1.67em",
      `font-family:${theme.font.family.mono}`,
      `font-size:${theme.font.size.sm}`,
      `font-weight:${theme.font.weight.sans.medium}`,
      "display:inline-flex",
      "align-items:center",
      "justify-content:center",
      `color:${debossed ? theme.tokens.content.secondary : theme.tokens.content.primary}`,
      `background:${debossed ? theme.tokens.background.secondary : theme.tokens.background.primary}`,
      `border:${theme.border.md} solid ${theme.tokens.border.primary}`,
      debossed
        ? `border-top:${theme.border.xl} solid ${theme.tokens.border.primary}`
        : `border-bottom:${theme.border.xl} solid ${theme.tokens.border.primary}`,
      `border-radius:${theme.radius.sm}`,
      "box-shadow:none",
    ].join(";"),
  ]);
}
