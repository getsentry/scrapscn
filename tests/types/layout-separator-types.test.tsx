import { Container, Surface } from "@/components/ui/layout";
import { Separator } from "@/components/ui/separator";

const renderContainer = (
  <Container>{({ className }) => <div className={className} />}</Container>
);

const renderContainerWithId = (
  // @ts-expect-error The render-function form cannot forward native attributes.
  <Container id="not-allowed">{() => <div />}</Container>
);

const renderQueryContainer = (
  // @ts-expect-error The render-function form cannot own a query container.
  <Container containerType="inline-size">{() => <div />}</Container>
);

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
void separatorWithChildren;
