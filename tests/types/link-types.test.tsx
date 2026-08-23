import {
  ExternalLink,
  Link,
  LinkBehaviorContextProvider,
  type LinkProps,
} from "@/components/ui/link";

const props: LinkProps = {
  preventScrollReset: true,
  reloadDocument: false,
  replace: true,
  to: { pathname: "/issues/", search: "?query=error" },
};

<Link {...props}>Issues</Link>;

const anchorRef = (element: HTMLAnchorElement | null) => element?.focus();
<Link ref={anchorRef} to="/issues/">Issues</Link>;
<ExternalLink href="https://docs.sentry.io">Docs</ExternalLink>;
<LinkBehaviorContextProvider value={null}>
  <Link to="/issues/">Issues</Link>
</LinkBehaviorContextProvider>;

// @ts-expect-error The canonical API uses router `to`, not anchor `href`.
<Link href="/issues/">Issues</Link>;
// @ts-expect-error The canonical API has no visual variant prop.
<Link to="/issues/" variant="accent">Issues</Link>;
// @ts-expect-error The canonical LinkProps uses HTMLAttributes, not AnchorHTMLAttributes.
<Link download="issues.csv" to="/issues/">Issues</Link>;
