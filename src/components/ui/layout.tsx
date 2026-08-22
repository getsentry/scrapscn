"use client";

import {
  createContext,
  createElement,
  forwardRef,
  Fragment,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type DetailedHTMLProps,
  type ForwardedRef,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefCallback,
  type RefObject,
} from "react";

import { Separator, type SeparatorProps } from "./separator";
import {
  combineLayoutClassNames as combineClassNames,
  compileLayoutStyle,
  compileResponsiveLayoutValue,
  createLayoutCssDeclaration as declaration,
  isLayoutResponsiveValue as isResponsive,
  isValidLayoutDomProp,
  LAYOUT_CONTAINER_ORDER as CONTAINER_ORDER,
  LAYOUT_THEME,
  LAYOUT_VIEWPORT_ORDER as VIEWPORT_ORDER,
  resolveLayoutBorder,
  resolveLayoutMargin,
  resolveLayoutRadius,
  resolveLayoutSpacing,
  type LayoutBorderVariant,
  type LayoutContainerBreakpoint,
  type LayoutCssDeclaration,
  type LayoutMargin,
  type LayoutRadiusSize,
  type LayoutResponsive,
  type LayoutResponsiveBreakpoint,
  type LayoutResponsiveKey,
  type LayoutShorthand,
  type LayoutSpaceSize,
  type LayoutSurfaceVariant,
  type LayoutTheme,
  type LayoutViewportBreakpoint,
} from "./layout-style-engine";

type SpaceSize = LayoutSpaceSize;
type RadiusSize = LayoutRadiusSize;
type BorderVariant = LayoutBorderVariant;
type SurfaceVariant = LayoutSurfaceVariant;
type ContainerBreakpoint = LayoutContainerBreakpoint;
type ViewportBreakpoint = LayoutViewportBreakpoint;
type ResponsiveBreakpoint = LayoutResponsiveBreakpoint;

/** A responsive key targets either the nearest query container or the viewport. */
export type ResponsiveKey = LayoutResponsiveKey;

/** A responsive value uses bare container keys and `screen:` viewport keys. */
export type Responsive<T> = LayoutResponsive<T>;

type Shorthand<T extends string, N extends 4 | 2> = LayoutShorthand<T, N>;
type Margin = LayoutMargin;

/** Resolves one responsive property into the canonical container-then-viewport cascade. */
export function rc<T>(
  property: string,
  value: Responsive<T> | undefined,
  theme: LayoutTheme,
  resolver?: (
    value: T | undefined,
    breakpoint: ResponsiveBreakpoint | undefined,
    theme: LayoutTheme
  ) => string | undefined
): string | undefined {
  return compileResponsiveLayoutValue(property, value, theme, resolver);
}

/** Resolves a semantic border token to a one-pixel CSS border. */
export function getBorder(
  border: BorderVariant | undefined,
  breakpoint: ResponsiveBreakpoint | undefined,
  theme: LayoutTheme
): string | undefined {
  return resolveLayoutBorder(border, breakpoint, theme);
}

/** Resolves a radius token or shorthand to CSS values. */
export function getRadius(
  value: Shorthand<RadiusSize, 4> | undefined,
  breakpoint: ResponsiveBreakpoint | undefined,
  theme: LayoutTheme
): string | undefined {
  return resolveLayoutRadius(value, breakpoint, theme);
}

/** Resolves a spacing token or shorthand to CSS values. */
export function getSpacing(
  value: Shorthand<SpaceSize, 4> | undefined,
  breakpoint: ResponsiveBreakpoint | undefined,
  theme: LayoutTheme
): string | undefined {
  return resolveLayoutSpacing(value, breakpoint, theme);
}

/** Resolves a margin token or shorthand to CSS values. */
export function getMargin(
  value: Shorthand<Margin, 4> | undefined,
  breakpoint: ResponsiveBreakpoint | undefined,
  theme: LayoutTheme
): string | undefined {
  return resolveLayoutMargin(value, breakpoint, theme);
}

type CssDeclaration = LayoutCssDeclaration;

interface LayoutStyleResource {
  className?: string;
  resource?: ReactElement;
}

function createLayoutStyleResource(
  declarations: readonly CssDeclaration[]
): LayoutStyleResource {
  const { className, css } = compileLayoutStyle("layout", declarations);
  return {
    className,
    resource:
      className && css ? (
        <style href={className} precedence="scraps-layout">
          {css}
        </style>
      ) : undefined,
  };
}
interface ContainerLayoutProps {
  background?: Responsive<SurfaceVariant>;
  display?: Responsive<
    | "block"
    | "inline"
    | "inline-block"
    | "flex"
    | "inline-flex"
    | "grid"
    | "inline-grid"
    | "contents"
    | "none"
  >;
  padding?: Responsive<Shorthand<SpaceSize, 4>>;
  paddingTop?: Responsive<SpaceSize>;
  paddingBottom?: Responsive<SpaceSize>;
  paddingLeft?: Responsive<SpaceSize>;
  paddingRight?: Responsive<SpaceSize>;
  position?: Responsive<
    "static" | "relative" | "absolute" | "fixed" | "sticky"
  >;
  inset?: Responsive<CSSProperties["inset"]>;
  top?: Responsive<CSSProperties["top"]>;
  bottom?: Responsive<CSSProperties["bottom"]>;
  left?: Responsive<CSSProperties["left"]>;
  right?: Responsive<CSSProperties["right"]>;
  overflow?: Responsive<"visible" | "hidden" | "scroll" | "auto">;
  overflowX?: Responsive<"visible" | "hidden" | "scroll" | "auto">;
  overflowY?: Responsive<"visible" | "hidden" | "scroll" | "auto">;
  overscrollBehavior?: Responsive<"contain" | "auto" | "none">;
  pointerEvents?: Responsive<CSSProperties["pointerEvents"]>;
  cursor?: Responsive<CSSProperties["cursor"]>;
  contain?: Responsive<CSSProperties["contain"]>;
  containerType?: "inline-size" | "size" | "normal";
  radius?: Responsive<Shorthand<RadiusSize, 4>>;
  width?: Responsive<CSSProperties["width"]>;
  minWidth?: Responsive<CSSProperties["minWidth"]>;
  maxWidth?: Responsive<CSSProperties["maxWidth"]>;
  height?: Responsive<CSSProperties["height"]>;
  minHeight?: Responsive<CSSProperties["minHeight"]>;
  maxHeight?: Responsive<CSSProperties["maxHeight"]>;
  border?: Responsive<BorderVariant>;
  borderTop?: Responsive<BorderVariant>;
  borderBottom?: Responsive<BorderVariant>;
  borderLeft?: Responsive<BorderVariant>;
  borderRight?: Responsive<BorderVariant>;
  area?: Responsive<CSSProperties["gridArea"]>;
  row?: Responsive<CSSProperties["gridRow"]>;
  column?: Responsive<CSSProperties["gridColumn"]>;
  order?: Responsive<CSSProperties["order"]>;
  flex?: Responsive<CSSProperties["flex"]>;
  flexGrow?: Responsive<CSSProperties["flexGrow"]>;
  flexShrink?: Responsive<CSSProperties["flexShrink"]>;
  flexBasis?: Responsive<CSSProperties["flexBasis"]>;
  alignSelf?: Responsive<CSSProperties["alignSelf"]>;
  justifySelf?: Responsive<CSSProperties["justifySelf"]>;
  visibility?: Responsive<"visible" | "hidden" | "collapse">;
  whiteSpace?: Responsive<
    "break-spaces" | "normal" | "nowrap" | "pre" | "pre-line" | "pre-wrap"
  >;
  /** @deprecated Use the `gap` prop on Flex or Grid. */
  margin?: Responsive<Shorthand<Margin, 4>>;
  /** @deprecated Use the `gap` prop on Flex or Grid. */
  marginTop?: Responsive<Margin>;
  /** @deprecated Use the `gap` prop on Flex or Grid. */
  marginBottom?: Responsive<Margin>;
  /** @deprecated Use the `gap` prop on Flex or Grid. */
  marginLeft?: Responsive<Margin>;
  /** @deprecated Use the `gap` prop on Flex or Grid. */
  marginRight?: Responsive<Margin>;
}

type ContainerElement =
  | "article"
  | "aside"
  | "blockquote"
  | "div"
  | "fieldset"
  | "figure"
  | "footer"
  | "header"
  | "label"
  | "li"
  | "main"
  | "nav"
  | "ol"
  | "section"
  | "span"
  | "summary"
  | "ul"
  | "hr";

/** Props for a polymorphic layout container. Layout-only props never reach the DOM. */
export type ContainerProps<T extends ContainerElement = "div"> =
  ContainerLayoutProps & {
    as?: T;
    children?: ReactNode;
    htmlFor?: T extends "label" ? string : never;
    ref?: Ref<HTMLElementTagNameMap[T] | null>;
    /** @deprecated Use layout props instead. */
    style?: CSSProperties;
  } & Omit<
      DetailedHTMLProps<
        HTMLAttributes<HTMLElementTagNameMap[T]>,
        HTMLElementTagNameMap[T]
      >,
      "style"
    >;

/** Props for the no-wrapper render-function Container form. */
export type ContainerPropsWithRenderFunction<
  T extends ContainerElement = "div"
> = Omit<ContainerLayoutProps, "containerType"> & {
  children: (props: { className: string }) => ReactNode | undefined;
  as?: never;
  containerType?: never;
  htmlFor?: never;
  ref?: never;
} & Partial<
    Record<
      Exclude<
        keyof DetailedHTMLProps<
          HTMLAttributes<HTMLElementTagNameMap[T]>,
          HTMLElementTagNameMap[T]
        >,
        "children"
      >,
      never
    >
  >;

const ContainerQueryContext = createContext<ContainerBreakpoint | null>(null);

function getContentBoxInlineSize(element: Element): number {
  const styles = window.getComputedStyle(element);
  const horizontalPadding =
    (Number.parseFloat(styles.paddingLeft) || 0) +
    (Number.parseFloat(styles.paddingRight) || 0);
  return Math.max(0, (element as HTMLElement).clientWidth - horizontalPadding);
}

function findContainerBreakpoint(inlineSize: number): ContainerBreakpoint {
  for (let index = CONTAINER_ORDER.length - 1; index >= 0; index--) {
    const breakpoint = CONTAINER_ORDER[index];
    if (
      breakpoint !== undefined &&
      inlineSize >= Number.parseFloat(LAYOUT_THEME.container[breakpoint])
    )
      return breakpoint;
  }
  return "zero";
}

/** Provides the active breakpoint for the nearest CSS query container. */
export function ContainerQueryProvider({
  elementRef,
  children,
}: {
  children: ReactNode;
  elementRef: RefObject<Element | null>;
}) {
  const [breakpoint, setBreakpoint] = useState<ContainerBreakpoint>("zero");
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    const updateBreakpoint = (inlineSize: number) =>
      setBreakpoint(findContainerBreakpoint(inlineSize));
    updateBreakpoint(getContentBoxInlineSize(element));
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const contentBox = Array.isArray(entry.contentBoxSize)
        ? entry.contentBoxSize[0]
        : entry.contentBoxSize;
      updateBreakpoint(
        contentBox?.inlineSize ?? getContentBoxInlineSize(element)
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef]);
  return (
    <ContainerQueryContext.Provider value={breakpoint}>
      {children}
    </ContainerQueryContext.Provider>
  );
}

/** Returns the active breakpoint of the nearest query container. */
export function useContainerBreakpoint(): ContainerBreakpoint {
  return useContext(ContainerQueryContext) ?? "zero";
}

/** Reports whether the component is inside a query container. */
export function useHasContainerQuery(): boolean {
  return useContext(ContainerQueryContext) !== null;
}

interface ViewportQuery {
  breakpoint: ViewportBreakpoint;
  query: MediaQueryList;
}
function findViewportBreakpoint(
  queries: readonly ViewportQuery[]
): ViewportBreakpoint {
  return queries.find(({ query }) => query.matches)?.breakpoint ?? "2xs";
}
function getServerViewportBreakpoint(): ViewportBreakpoint {
  return "2xs";
}

function useActiveViewportBreakpoint(): ViewportBreakpoint {
  const mediaQueries = useMemo<ViewportQuery[]>(() => {
    if (typeof window === "undefined" || !window.matchMedia) return [];
    return [...VIEWPORT_ORDER].reverse().map(({ token }) => ({
      breakpoint: token,
      query: window.matchMedia(
        `(min-width: ${LAYOUT_THEME.breakpoints[token]})`
      ),
    }));
  }, []);
  const subscribe = useCallback(
    (notify: () => void) => {
      for (const { query } of mediaQueries)
        query.addEventListener("change", notify);
      return () => {
        for (const { query } of mediaQueries)
          query.removeEventListener("change", notify);
      };
    },
    [mediaQueries]
  );
  const getSnapshot = useCallback(
    () => findViewportBreakpoint(mediaQueries),
    [mediaQueries]
  );
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerViewportBreakpoint
  );
}

/** Resolves a responsive value with the same cascade as the generated CSS. */
export function useResponsivePropValue<T>(value: Responsive<T>): T {
  const containerBreakpoint = useContainerBreakpoint();
  const viewportBreakpoint = useActiveViewportBreakpoint();
  if (!isResponsive(value)) return value;
  if (Object.keys(value).length === 0)
    throw new Error("Responsive prop must contain at least one breakpoint");
  let resolved: T | undefined;
  let first = true;
  const cascade = (keys: readonly ResponsiveKey[], activeIndex: number) => {
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      if (key === undefined) continue;
      const candidate = value[key];
      if (candidate === undefined) continue;
      if (first || activeIndex >= index) resolved = candidate;
      first = false;
    }
  };
  cascade(CONTAINER_ORDER, CONTAINER_ORDER.indexOf(containerBreakpoint));
  cascade(
    VIEWPORT_ORDER.map(({ key }) => key),
    VIEWPORT_ORDER.findIndex(({ token }) => token === viewportBreakpoint)
  );
  if (resolved === undefined)
    throw new Error("Responsive prop does not define a supported breakpoint");
  return resolved;
}

const CONTAINER_LAYOUT_PROP_NAMES = new Set<string>([
  "alignSelf",
  "area",
  "as",
  "background",
  "border",
  "borderTop",
  "borderBottom",
  "borderLeft",
  "borderRight",
  "bottom",
  "column",
  "contain",
  "containerType",
  "cursor",
  "display",
  "flex",
  "flexBasis",
  "flexGrow",
  "flexShrink",
  "height",
  "inset",
  "justifySelf",
  "left",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "maxHeight",
  "maxWidth",
  "minHeight",
  "minWidth",
  "order",
  "overflow",
  "overflowX",
  "overflowY",
  "overscrollBehavior",
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "pointerEvents",
  "position",
  "radius",
  "right",
  "row",
  "top",
  "visibility",
  "whiteSpace",
  "width",
]);
const COMPONENT_LAYOUT_PROP_NAMES = new Set<string>([
  ...CONTAINER_LAYOUT_PROP_NAMES,
  "align",
  "alignContent",
  "areas",
  "autoColumns",
  "autoRows",
  "columns",
  "direction",
  "elevation",
  "flow",
  "gap",
  "justify",
  "justifyItems",
  "rows",
  "variant",
  "wrap",
]);

function containerDeclarations(props: ContainerLayoutProps): CssDeclaration[] {
  return [
    declaration("container-type", props.containerType),
    declaration("display", props.display),
    declaration("position", props.position),
    declaration("inset", props.inset),
    declaration("top", props.top),
    declaration("bottom", props.bottom),
    declaration("left", props.left),
    declaration("right", props.right),
    declaration("overflow", props.overflow),
    declaration("overflow-x", props.overflowX),
    declaration("overflow-y", props.overflowY),
    declaration("overscroll-behavior", props.overscrollBehavior),
    declaration("pointer-events", props.pointerEvents),
    declaration("cursor", props.cursor),
    declaration("contain", props.contain),
    declaration("padding", props.padding, getSpacing),
    declaration("padding-top", props.paddingTop, getSpacing),
    declaration("padding-bottom", props.paddingBottom, getSpacing),
    declaration("padding-left", props.paddingLeft, getSpacing),
    declaration("padding-right", props.paddingRight, getSpacing),
    declaration("margin", props.margin, getMargin),
    declaration("margin-top", props.marginTop, getMargin),
    declaration("margin-bottom", props.marginBottom, getMargin),
    declaration("margin-left", props.marginLeft, getMargin),
    declaration("margin-right", props.marginRight, getMargin),
    declaration("background", props.background, (value, _breakpoint, theme) =>
      value ? theme.tokens.background[value] : undefined
    ),
    declaration("border-radius", props.radius, getRadius),
    declaration("width", props.width),
    declaration("min-width", props.minWidth),
    declaration("max-width", props.maxWidth),
    declaration("height", props.height),
    declaration("min-height", props.minHeight),
    declaration("max-height", props.maxHeight),
    declaration("grid-area", props.area),
    declaration("grid-row", props.row),
    declaration("grid-column", props.column),
    declaration("order", props.order),
    declaration("flex", props.flex),
    declaration("flex-grow", props.flexGrow),
    declaration("flex-shrink", props.flexShrink),
    declaration("flex-basis", props.flexBasis),
    declaration("align-self", props.alignSelf),
    declaration("justify-self", props.justifySelf),
    declaration("border", props.border, getBorder),
    declaration("border-top", props.borderTop, getBorder),
    declaration("border-bottom", props.borderBottom, getBorder),
    declaration("border-left", props.borderLeft, getBorder),
    declaration("border-right", props.borderRight, getBorder),
    declaration("visibility", props.visibility),
    declaration("white-space", props.whiteSpace),
  ];
}

interface RuntimeLayoutProps extends ContainerLayoutProps {
  as?: ContainerElement;
  children?:
    | ReactNode
    | ((props: { className: string }) => ReactNode | undefined);
  className?: string;
  [key: string]: unknown;
}

function useMergedContainerRef(
  forwardedRef: Ref<HTMLElement | null> | undefined,
  containerRef: RefObject<HTMLElement | null>
): RefCallback<HTMLElement> {
  return useCallback(
    (node) => {
      containerRef.current = node;
      if (typeof forwardedRef !== "function") {
        if (forwardedRef) forwardedRef.current = node;
        return () => {
          containerRef.current = null;
          if (forwardedRef) forwardedRef.current = null;
        };
      }
      const cleanup = forwardedRef(node);
      return () => {
        containerRef.current = null;
        if (typeof cleanup === "function") cleanup();
        else forwardedRef(null);
      };
    },
    [containerRef, forwardedRef]
  );
}

function useLayoutElement(
  props: RuntimeLayoutProps,
  forwardedRef: ForwardedRef<HTMLElement>,
  declarations: readonly CssDeclaration[]
): ReactElement {
  const { className: generatedClassName, resource: styleResource } =
    createLayoutStyleResource(declarations);
  const className = combineClassNames(generatedClassName, props.className);
  const containerRef = useRef<HTMLElement>(null);
  const isQueryContainer =
    props.containerType !== undefined && props.containerType !== "normal";
  const containerElementRef = useMergedContainerRef(forwardedRef, containerRef);
  const mergedRef = isQueryContainer ? containerElementRef : forwardedRef;
  if (typeof props.children === "function") {
    const child = props.children({ className: className ?? "" });
    return createElement(Fragment, null, styleResource, child);
  }
  const domProps: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(props)) {
    if (
      name !== "children" &&
      name !== "className" &&
      !COMPONENT_LAYOUT_PROP_NAMES.has(name) &&
      isValidLayoutDomProp(name)
    )
      domProps[name] = value;
  }
  const node = createElement(
    props.as ?? "div",
    { ...domProps, className, key: "layout-node", ref: mergedRef },
    props.children
  );
  const styledNode = createElement(Fragment, null, styleResource, node);
  return isQueryContainer ? (
    <ContainerQueryProvider elementRef={containerRef}>
      {styledNode}
    </ContainerQueryProvider>
  ) : (
    styledNode
  );
}

type ContainerRuntimeProps = RuntimeLayoutProps & {
  ref?: Ref<HTMLElement | null>;
};
function ContainerInner(
  props: ContainerRuntimeProps,
  forwardedRef: ForwardedRef<HTMLElement>
): ReactElement {
  return useLayoutElement(props, forwardedRef, containerDeclarations(props));
}

/** A polymorphic layout primitive with token-aware responsive properties. */
export const Container = forwardRef<HTMLElement, ContainerRuntimeProps>(
  ContainerInner
) as unknown as <T extends ContainerElement = "div">(
  props: ContainerProps<T> | ContainerPropsWithRenderFunction<T>
) => ReactElement;

interface FlexLayoutProps {
  align?: Responsive<"start" | "end" | "center" | "baseline" | "stretch">;
  direction?: Responsive<"row" | "row-reverse" | "column" | "column-reverse">;
  display?: Responsive<"flex" | "inline-flex" | "none">;
  flex?: Responsive<CSSProperties["flex"]>;
  gap?: Responsive<SpaceSize | `${SpaceSize} ${SpaceSize}`>;
  justify?: Responsive<
    | "start"
    | "end"
    | "center"
    | "between"
    | "around"
    | "evenly"
    | "left"
    | "right"
  >;
  wrap?: Responsive<"nowrap" | "wrap" | "wrap-reverse">;
}

/** Props for a flex layout container. */
export type FlexProps<T extends ContainerElement = "div"> = Omit<
  ContainerProps<T>,
  "display"
> &
  FlexLayoutProps;
type FlexPropsWithRenderFunction<T extends ContainerElement = "div"> = Omit<
  ContainerPropsWithRenderFunction<T>,
  "display"
> &
  FlexLayoutProps;

function resolveFlexAlignment(value: string | undefined): string | undefined {
  if (value === "start") return "flex-start";
  if (value === "end") return "flex-end";
  return value;
}
function resolveContentAlignment(
  value: string | undefined
): string | undefined {
  if (value === "between") return "space-between";
  if (value === "around") return "space-around";
  if (value === "evenly") return "space-evenly";
  return value;
}
function flexDeclarations(props: FlexLayoutProps): CssDeclaration[] {
  return [
    declaration("display", props.display ?? "flex"),
    declaration("gap", props.gap, getSpacing),
    declaration("flex-direction", props.direction),
    declaration("flex-wrap", props.wrap),
    declaration("flex", props.flex),
    declaration("justify-content", props.justify, (value) =>
      resolveFlexAlignment(resolveContentAlignment(value))
    ),
    declaration("align-items", props.align, (value) =>
      resolveFlexAlignment(value)
    ),
  ];
}
type FlexRuntimeProps = RuntimeLayoutProps & FlexLayoutProps;
function FlexInner(
  props: FlexRuntimeProps,
  ref: ForwardedRef<HTMLElement>
): ReactElement {
  return useLayoutElement(props, ref, [
    ...containerDeclarations(props),
    ...flexDeclarations(props),
  ]);
}

/** A Container that defaults to `display: flex`. */
const FlexRuntimeComponent = forwardRef<HTMLElement, FlexRuntimeProps>(
  FlexInner
);
export const Flex = FlexRuntimeComponent as unknown as <
  T extends ContainerElement = "div"
>(
  props: FlexProps<T> | FlexPropsWithRenderFunction<T>
) => ReactElement;

interface GridLayoutProps {
  align?: Responsive<"start" | "end" | "center" | "baseline" | "stretch">;
  alignContent?: Responsive<
    "start" | "end" | "center" | "between" | "around" | "evenly" | "stretch"
  >;
  areas?: Responsive<CSSProperties["gridTemplateAreas"]>;
  autoColumns?: Responsive<CSSProperties["gridAutoColumns"]>;
  autoRows?: Responsive<CSSProperties["gridAutoRows"]>;
  columns?: Responsive<CSSProperties["gridTemplateColumns"]>;
  display?: Responsive<"grid" | "inline-grid" | "none">;
  flow?: Responsive<"row" | "column" | "row dense" | "column dense">;
  gap?: Responsive<SpaceSize | `${SpaceSize} ${SpaceSize}`>;
  justify?: Responsive<
    "start" | "end" | "center" | "between" | "around" | "evenly" | "stretch"
  >;
  justifyItems?: Responsive<"start" | "end" | "center" | "stretch">;
  rows?: Responsive<CSSProperties["gridTemplateRows"]>;
}

/** Props for a grid layout container. */
export type GridProps<T extends ContainerElement = "div"> = ContainerProps<T> &
  GridLayoutProps;
type GridPropsWithRenderFunction<T extends ContainerElement = "div"> =
  ContainerPropsWithRenderFunction<T> & GridLayoutProps;
function gridDeclarations(props: GridLayoutProps): CssDeclaration[] {
  return [
    declaration("display", props.display ?? "grid"),
    declaration("gap", props.gap, getSpacing),
    declaration("grid-template-columns", props.columns),
    declaration("grid-template-rows", props.rows),
    declaration("grid-template-areas", props.areas),
    declaration("grid-auto-columns", props.autoColumns),
    declaration("grid-auto-rows", props.autoRows),
    declaration("grid-auto-flow", props.flow),
    declaration("justify-content", props.justify, (value) =>
      resolveContentAlignment(value)
    ),
    declaration("align-content", props.alignContent, (value) =>
      resolveContentAlignment(value)
    ),
    declaration("align-items", props.align),
    declaration("justify-items", props.justifyItems),
  ];
}
type GridRuntimeProps = RuntimeLayoutProps & GridLayoutProps;
function GridInner(
  props: GridRuntimeProps,
  ref: ForwardedRef<HTMLElement>
): ReactElement {
  return useLayoutElement(props, ref, [
    ...containerDeclarations(props),
    ...gridDeclarations(props),
  ]);
}

/** A Container that defaults to `display: grid`. */
export const Grid = forwardRef<HTMLElement, GridRuntimeProps>(
  GridInner
) as unknown as <T extends ContainerElement = "div">(
  props: GridProps<T> | GridPropsWithRenderFunction<T>
) => ReactElement;

/** Props for a vertical-by-default flex layout container. */
export type StackProps<T extends ContainerElement = "div"> = FlexProps<T>;
type StackPropsWithRenderFunction<T extends ContainerElement = "div"> =
  FlexPropsWithRenderFunction<T>;
type StackDirection = NonNullable<StackProps["direction"]>;
interface StackDirectionContextValue {
  direction: StackDirection;
}
const StackDirectionContext = createContext<StackDirectionContextValue>({
  direction: "row",
});
type StackRuntimeProps = FlexRuntimeProps;
function StackInner(
  props: StackRuntimeProps,
  ref: ForwardedRef<HTMLElement>
): ReactElement {
  const direction = props.direction ?? "column";
  const contextValue = useMemo(() => ({ direction }), [direction]);
  return (
    <StackDirectionContext.Provider value={contextValue}>
      <FlexRuntimeComponent {...props} ref={ref} direction={direction} />
    </StackDirectionContext.Provider>
  );
}
const StackComponent = forwardRef<HTMLElement, StackRuntimeProps>(
  StackInner
) as unknown as <T extends ContainerElement = "div">(
  props: StackProps<T> | StackPropsWithRenderFunction<T>
) => ReactElement;
function getOrientationFromDirection(
  direction: "row" | "row-reverse" | "column" | "column-reverse"
): "horizontal" | "vertical" {
  return direction === "row" || direction === "row-reverse"
    ? "horizontal"
    : "vertical";
}
function StackSeparator(
  props: Omit<SeparatorProps, "orientation">
): ReactElement {
  const { direction } = useContext(StackDirectionContext);
  const stackOrientation = getOrientationFromDirection(
    useResponsivePropValue(direction)
  );
  return (
    <Separator
      {...props}
      border={props.border ?? "primary"}
      orientation={
        stackOrientation === "horizontal" ? "vertical" : "horizontal"
      }
    />
  );
}

/** A vertical-by-default Flex with an orientation-aware Separator. */
export const Stack = Object.assign(StackComponent, {
  Separator: StackSeparator,
});

interface FlatSurfaceProps<T extends ContainerElement = "div">
  extends Omit<ContainerProps<T>, "background" | "border"> {
  elevation?: never;
  variant?: SurfaceVariant;
}
interface OverlaySurfaceProps<T extends ContainerElement = "div">
  extends Omit<ContainerProps<T>, "background" | "border"> {
  elevation?: "low" | "medium" | "high";
  variant: "overlay";
}
interface FlatSurfacePropsWithRenderFunction {
  children: (props: { className: string }) => ReactNode;
  elevation?: never;
  variant?: SurfaceVariant;
}
interface OverlaySurfacePropsWithRenderFunction {
  children: (props: { className: string }) => ReactNode;
  elevation?: "low" | "medium" | "high";
  variant: "overlay";
}
type SurfaceProps<T extends ContainerElement = "div"> =
  | FlatSurfaceProps<T>
  | OverlaySurfaceProps<T>;
type SurfaceRenderProps =
  | FlatSurfacePropsWithRenderFunction
  | OverlaySurfacePropsWithRenderFunction;
type SurfaceRuntimeProps = RuntimeLayoutProps & {
  elevation?: "low" | "medium" | "high";
  variant?: SurfaceVariant | "overlay";
};
function surfaceDeclarations(props: SurfaceRuntimeProps): CssDeclaration[] {
  const isOverlay = props.variant === "overlay";
  return [
    declaration("background", props.variant, (value, _breakpoint, theme) =>
      value ? theme.tokens.background[value] : undefined
    ),
    declaration("border", isOverlay ? "primary" : undefined, getBorder),
    declaration(
      "border-radius",
      props.radius ?? (isOverlay ? "md" : undefined),
      getRadius
    ),
    declaration(
      "box-shadow",
      props.elevation ?? (isOverlay ? "low" : undefined),
      (value, _breakpoint, theme) => (value ? theme.shadow[value] : undefined)
    ),
  ];
}
function SurfaceInner(
  props: SurfaceRuntimeProps,
  ref: ForwardedRef<HTMLElement>
): ReactElement {
  const containerProps: RuntimeLayoutProps = {
    ...props,
    border: props.variant === "overlay" ? "primary" : undefined,
    radius: props.radius ?? (props.variant === "overlay" ? "md" : undefined),
  };
  return useLayoutElement(containerProps, ref, [
    ...containerDeclarations(containerProps),
    ...surfaceDeclarations(props),
  ]);
}

/** A Container with canonical surface backgrounds, borders, radii, and shadows. */
export const Surface = forwardRef<HTMLElement, SurfaceRuntimeProps>(
  SurfaceInner
) as unknown as <T extends ContainerElement = "div">(
  props: SurfaceProps<T> | SurfaceRenderProps
) => ReactElement;
