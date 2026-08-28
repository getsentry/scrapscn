import { BreadcrumbList, type BreadcrumbTitleItem } from "@/components/ui/breadcrumb-list";
import { Button } from "@/components/ui/button";

const title: BreadcrumbTitleItem = {
  type: "page-title",
  label: "Issue",
  pagination: {
    previous: { ariaLabel: "Previous", to: { pathname: "/issues/1", search: "?project=web" } },
    next: { ariaLabel: "Next" },
  },
  trailingActions: {
    type: "menu",
    triggerLabel: "Actions",
    items: [
      {
        key: "copy",
        label: "Copy",
        details: "Copies a short ID",
        leadingItems: "C",
        trailingItems: "⌘C",
        disabled: false,
        priority: "default",
        to: { pathname: "/copy" },
        onAction: () => {},
        submenu: { title: "More" },
        children: [{ key: "nested", label: "Nested" }],
      },
    ],
  },
};
<BreadcrumbList
  items={[
    {
      type: "link",
      label: "Issues",
      to: { pathname: "/issues", search: "?project=web", state: { source: "breadcrumbs" } },
    },
    {
      type: "select-projects",
      value: "web",
      options: [{ value: "web", label: "Web" }],
      onChange: (option) => option.value.toUpperCase(),
    },
  ]}
/>;
<BreadcrumbList.Title item={title} />;
<BreadcrumbList.Title
  item={{
    type: "editable-title",
    "aria-label": "Edit dashboard",
    allowEmpty: true,
    autoSelect: true,
    errorMessage: "Name is required",
    isDisabled: false,
    maxLength: 64,
    onChange: (value) => value.trim(),
    placeholder: "Untitled",
    value: "Dashboard",
  }}
/>;

const canonicalSerializedStyles = { name: "breadcrumb", styles: "color:red;" };
const titleWithCanonicalStyle: BreadcrumbTitleItem = {
  type: "page-title",
  label: "Issue",
  trailingActions: {
    type: "button",
    element: (
      <Button
        tooltipProps={{
          title: "Action",
          // @ts-expect-error Emotion SerializedStyles is an excluded portable input.
          overlayStyle: canonicalSerializedStyles,
        }}
      >
        Action
      </Button>
    ),
  },
};
void titleWithCanonicalStyle;

// @ts-expect-error BreadcrumbList has no page-title parent item.
<BreadcrumbList items={[{ type: "page-title", label: "Issue" }]} />;
// @ts-expect-error Editable titles require an accessible name.
<BreadcrumbList.Title item={{ type: "editable-title", onChange: () => {}, value: "Dashboard" }} />;
