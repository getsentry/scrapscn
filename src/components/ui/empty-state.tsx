import { type ReactNode } from "react";

import { Heading } from "./heading";
import { Flex, Stack, type FlexProps } from "./layout";
import { Text, type TextProps } from "./text";

type EmptyStateProps = Omit<FlexProps, "children" | "containerType" | "title"> & {
  title: ReactNode;
  action?: ReactNode;
  description?: ReactNode;
  illustration?: ReactNode;
};

/** The regular Scraps responsive no-content layout. */
export function EmptyState({
  action,
  description,
  illustration,
  title,
  ...props
}: EmptyStateProps) {
  const switchOn = "md";
  const textAlign: TextProps<"p">["align"] = {
    zero: "center",
    [switchOn]: "left",
  };

  return (
    <Flex containerType="inline-size" flexGrow={1} minWidth={0} width="100%">
      <Flex
        align="center"
        data-test-id="empty-state"
        direction={{ zero: "column", [switchOn]: "row" }}
        flexGrow={1}
        gap={{ zero: "xl", [switchOn]: "2xl" }}
        justify={{ zero: "start", [switchOn]: "center" }}
        {...props}
      >
        {illustration && (
          <Flex align="center" flexShrink={0} justify="center" overflow="hidden">
            {illustration}
          </Flex>
        )}
        <Stack gap="xl">
          <Stack gap="md" maxWidth="48ch" width="100%">
            <Heading align={textAlign} as="h3" size="lg">
              {title}
            </Heading>
            {description && (
              <Text align={textAlign} as="p" size="md" textWrap="balance" variant="muted">
                {description}
              </Text>
            )}
          </Stack>
          {action && (
            <Flex gap="md" justify={{ zero: "center", [switchOn]: "start" }} wrap="wrap">
              {action}
            </Flex>
          )}
        </Stack>
      </Flex>
    </Flex>
  );
}
