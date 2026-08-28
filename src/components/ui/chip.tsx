import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Flex } from "./layout";
import { Text } from "./text";

type ChipSize = "xs" | "sm" | "md";

interface BaseChipProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  operator?: string;
  property?: string;
  size?: ChipSize;
}

interface DismissableChipProps extends BaseChipProps {
  onDismiss?: () => void;
  readonly?: false;
}

interface ReadonlyChipProps extends BaseChipProps {
  readonly: true;
  onDismiss?: never;
}

type ChipProps = DismissableChipProps | ReadonlyChipProps;

const chipSizeClasses: Record<
  ChipSize,
  { dismiss: string; padding: string; paddingLeft: string; root: string }
> = {
  xs: {
    dismiss: "!w-5 !min-w-5 !px-1",
    padding: "px-1",
    paddingLeft: "pl-1",
    root: "h-5 rounded-[3px]",
  },
  sm: {
    dismiss: "!w-5 !min-w-5 !px-1",
    padding: "px-[6px]",
    paddingLeft: "pl-[6px]",
    root: "h-6 rounded-[4px]",
  },
  md: {
    dismiss: "!w-6 !min-w-6 !px-1",
    padding: "px-2",
    paddingLeft: "pl-2",
    root: "h-7 rounded-[5px]",
  },
};

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="size-3.5 fill-current" viewBox="0 0 16 16">
      <path d="M12.72 2.22C13.01 1.93 13.49 1.93 13.78 2.22C14.07 2.51 14.07 2.99 13.78 3.28L9.06 8L13.78 12.72C14.07 13.01 14.07 13.49 13.78 13.78C13.49 14.07 13.01 14.07 12.72 13.78L8 9.06L3.28 13.78C2.99 14.07 2.51 14.07 2.22 13.78C1.93 13.49 1.93 13.01 2.22 12.72L6.94 8L2.22 3.28C1.93 2.99 1.93 2.51 2.22 2.22C2.51 1.93 2.99 1.93 3.28 2.22L8 6.94L12.72 2.22Z" />
    </svg>
  );
}

export function Chip({
  className,
  onDismiss,
  operator,
  property,
  readonly = false,
  size = "md",
  value,
  ...rest
}: ChipProps) {
  const classes = chipSizeClasses[size];
  const textSize = size === "xs" ? "sm" : "md";
  const valueVariant = readonly ? "secondary" : property === undefined ? "primary" : "accent";
  const label = [property, operator, value].filter(Boolean).join(" ");

  return (
    <div
      {...rest}
      className={cn(
        "box-border inline-flex items-center overflow-hidden border border-[var(--scraps-chip-chonk)] bg-[var(--scraps-chip-background)] leading-4 shadow-[0_1px_0_0_var(--scraps-chip-chonk)]",
        onDismiss ? classes.paddingLeft : classes.padding,
        classes.root,
        className,
      )}
    >
      <Flex align="center" gap="xs" padding="2xs 0">
        {property !== undefined ? (
          <Text size={textSize} variant="primary" wrap="nowrap">
            {property}
          </Text>
        ) : null}
        {operator ? (
          <Text size={textSize} variant="secondary" wrap="nowrap">
            {operator}
          </Text>
        ) : null}
        {value !== undefined ? (
          <Text size={textSize} variant={valueVariant} wrap="nowrap">
            {value}
          </Text>
        ) : null}
      </Flex>
      {onDismiss ? (
        <Button
          aria-label={`Remove ${label}`}
          className={cn(
            "!h-auto !min-h-0 shrink-0 self-stretch !rounded-none text-[var(--scraps-chip-content-secondary)] hover:!bg-[var(--scraps-chip-hover)] hover:!text-[var(--scraps-chip-content-primary)]",
            classes.dismiss,
          )}
          icon={<CloseIcon />}
          size="zero"
          type="button"
          variant="transparent"
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
        />
      ) : null}
    </div>
  );
}
