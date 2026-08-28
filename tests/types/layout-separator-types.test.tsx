import { createRef, type ComponentProps } from "react";

import { Container, Flex, Grid, Stack, Surface } from "@/components/ui/layout";
import { Separator } from "@/components/ui/separator";
import "@/components/ui/layout.stories";

const renderContainer = <Container>{({ className }) => <div className={className} />}</Container>;

const renderContainerWithId = (
  // @ts-expect-error The render-function form cannot forward native attributes.
  <Container id="not-allowed">{() => <div />}</Container>
);

const renderQueryContainer = (
  // @ts-expect-error The render-function form cannot own a query container.
  <Container containerType="inline-size">{() => <div />}</Container>
);

const renderFiniteLayout = (
  <Flex gap="sm" direction="column">
    {({ className }) => <div className={className} />}
  </Flex>
);
const renderFiniteGrid = (
  <Grid display="grid" flow="row dense">
    {({ className }) => <div className={className} />}
  </Grid>
);
const renderFiniteStack = (
  <Stack gap="sm">{({ className }) => <div className={className} />}</Stack>
);
const ordinaryPolymorphicContainer = (
  <Container as="label" htmlFor="field">
    Label
  </Container>
);
const ordinaryOrderedContainer = (
  <Container as="ol" start={3}>
    <li>Third</li>
  </Container>
);
const orderedListRef = createRef<HTMLOListElement>();
const ordinaryOrderedContainerRef = (
  <Container as="ol" ref={orderedListRef} start={3}>
    <li>Third</li>
  </Container>
);
// @ts-expect-error A div does not accept label-only attributes.
const rejectDirectDivHtmlFor = <Container as="div" htmlFor="field" />;
// @ts-expect-error A div does not accept ordered-list attributes.
const rejectDirectDivStart = <Container as="div" start={3} />;

function ContainerWrapper(props: ComponentProps<typeof Container>) {
  return <Container {...props} />;
}
function FlexWrapper(props: ComponentProps<typeof Flex>) {
  return <Flex {...props} />;
}
function GridWrapper(props: ComponentProps<typeof Grid>) {
  return <Grid {...props} />;
}
function StackWrapper(props: ComponentProps<typeof Stack>) {
  return <Stack {...props} />;
}

const wrappedRenderContainer = (
  <ContainerWrapper>{({ className }) => <div className={className} />}</ContainerWrapper>
);
const wrappedRenderFlex = (
  <FlexWrapper gap="sm">{({ className }) => <div className={className} />}</FlexWrapper>
);
const wrappedRenderGrid = (
  <GridWrapper flow="row dense">{({ className }) => <div className={className} />}</GridWrapper>
);
const wrappedRenderStack = (
  <StackWrapper gap="sm">{({ className }) => <div className={className} />}</StackWrapper>
);
const wrappedOrdinaryContainer = (
  <ContainerWrapper as="label" htmlFor="field">
    Label
  </ContainerWrapper>
);
const wrappedOrderedContainer = (
  <ContainerWrapper as="ol" start={3}>
    <li>Third</li>
  </ContainerWrapper>
);
const wrappedOrdinaryFlex = (
  <FlexWrapper aria-label="Flex wrapper">
    <span>Flex child</span>
  </FlexWrapper>
);
const wrappedLabelFlex = (
  <FlexWrapper as="label" htmlFor="flex-field">
    Flex label
  </FlexWrapper>
);
const wrappedOrdinaryGrid = (
  <GridWrapper id="grid-wrapper">
    <span>Grid child</span>
  </GridWrapper>
);
const wrappedOrderedGrid = (
  <GridWrapper as="ol" start={3}>
    <li>Grid item</li>
  </GridWrapper>
);
const wrappedOrdinaryStack = (
  <StackWrapper title="Stack wrapper">
    <span>Stack child</span>
  </StackWrapper>
);
const wrappedLabelStack = (
  <StackWrapper as="label" htmlFor="stack-field">
    Stack label
  </StackWrapper>
);
const wrappedDivRef = createRef<HTMLDivElement>();
const wrappedContainerRef = <ContainerWrapper ref={wrappedDivRef}>Container</ContainerWrapper>;
// @ts-expect-error The default derived Container branch is a div.
const rejectWrappedDivHtmlFor = <ContainerWrapper as="div" htmlFor="field" />;
// @ts-expect-error The default derived Container branch is a div.
const rejectWrappedDivStart = <ContainerWrapper as="div" start={3} />;
// @ts-expect-error Flex keeps native attributes tied to its selected tag.
const rejectWrappedFlexDivHtmlFor = <FlexWrapper as="div" htmlFor="field" />;
// @ts-expect-error Grid keeps native attributes tied to its selected tag.
const rejectWrappedGridDivStart = <GridWrapper as="div" start={3} />;
// @ts-expect-error Stack keeps native attributes tied to its selected tag.
const rejectWrappedStackDivHtmlFor = <StackWrapper as="div" htmlFor="field" />;
// @ts-expect-error A selected ol requires an ordered-list ref.
const rejectWrongOrderedListRef = <Container as="ol" ref={wrappedDivRef} />;
const rejectArbitraryContainerWidth = (
  // @ts-expect-error Render-function elements cannot carry arbitrary CSSProperties values.
  <Container width="calc(100% - 1px)">{() => <div />}</Container>
);
// @ts-expect-error Render-function elements cannot carry arbitrary flex values.
const rejectArbitraryFlex = <Flex flex="1 1 auto">{() => <div />}</Flex>;
// @ts-expect-error Render-function elements cannot carry arbitrary grid track values.
const rejectArbitraryGrid = <Grid columns="repeat(2, minmax(0, 1fr))">{() => <div />}</Grid>;
// @ts-expect-error Render-function elements cannot carry arbitrary insets.
const rejectArbitraryInset = <Container inset="1px">{() => <div />}</Container>;
// @ts-expect-error Render-function elements cannot carry arbitrary bottom offsets.
const rejectArbitraryBottom = <Container bottom="1px">{() => <div />}</Container>;
// @ts-expect-error Render-function elements cannot carry cursor CSS values.
const rejectArbitraryCursor = <Container cursor="pointer">{() => <div />}</Container>;
// @ts-expect-error Render-function elements cannot carry grid area CSS values.
const rejectArbitraryArea = <Container area="main">{() => <div />}</Container>;
// @ts-expect-error Derived Flex props must keep arbitrary render fields excluded.
const rejectWrappedArbitraryFlex = <FlexWrapper flex="1 1 auto">{() => <div />}</FlexWrapper>;
const rejectWrappedArbitraryWidth = (
  // @ts-expect-error Derived Container props must keep arbitrary render fields excluded.
  <ContainerWrapper width="calc(100% - 1px)">{() => <div />}</ContainerWrapper>
);
const rejectWrappedNativeAttribute = (
  // @ts-expect-error Derived Container render props cannot forward native attributes.
  <ContainerWrapper id="not-allowed">{() => <div />}</ContainerWrapper>
);
// @ts-expect-error Derived Grid props must keep arbitrary render fields excluded.
const rejectWrappedGridTracks = <GridWrapper columns="repeat(2, 1fr)">{() => <div />}</GridWrapper>;
// @ts-expect-error Derived Stack props must keep arbitrary render fields excluded.
const rejectWrappedStackFlex = <StackWrapper flex="1 1 auto">{() => <div />}</StackWrapper>;

// @ts-expect-error Flat surfaces cannot have elevation.
const elevatedFlatSurface = <Surface variant="primary" elevation="low" />;

const separatorWithChildren = (
  // @ts-expect-error Separators cannot have children.
  <Separator orientation="horizontal">content</Separator>
);

void renderContainer;
void renderContainerWithId;
void renderQueryContainer;
void elevatedFlatSurface;
void renderFiniteLayout;
void renderFiniteGrid;
void renderFiniteStack;
void ordinaryPolymorphicContainer;
void ordinaryOrderedContainer;
void ordinaryOrderedContainerRef;
void rejectDirectDivHtmlFor;
void rejectDirectDivStart;
void wrappedRenderContainer;
void wrappedRenderFlex;
void wrappedRenderGrid;
void wrappedRenderStack;
void wrappedOrdinaryContainer;
void wrappedOrderedContainer;
void wrappedOrdinaryFlex;
void wrappedLabelFlex;
void wrappedOrdinaryGrid;
void wrappedOrderedGrid;
void wrappedOrdinaryStack;
void wrappedLabelStack;
void wrappedContainerRef;
void rejectWrappedDivHtmlFor;
void rejectWrappedDivStart;
void rejectWrappedFlexDivHtmlFor;
void rejectWrappedGridDivStart;
void rejectWrappedStackDivHtmlFor;
void rejectWrongOrderedListRef;
void rejectArbitraryContainerWidth;
void rejectArbitraryFlex;
void rejectArbitraryGrid;
void rejectArbitraryInset;
void rejectArbitraryBottom;
void rejectArbitraryCursor;
void rejectArbitraryArea;
void rejectWrappedArbitraryFlex;
void rejectWrappedArbitraryWidth;
void rejectWrappedNativeAttribute;
void rejectWrappedGridTracks;
void rejectWrappedStackFlex;
void separatorWithChildren;
