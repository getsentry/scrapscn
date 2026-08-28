import { createRef } from "react";

import { Slider, type SliderProps } from "@/components/ui/slider";

export function SliderTypeEvidence() {
  const ref = createRef<HTMLInputElement>();
  const controlled = {
    "aria-label": "Volume",
    className: "consumer-slider",
    onChange: (value: number) => {
      void value;
    },
    ref,
    value: "",
  } satisfies SliderProps;
  const uncontrolled = {
    defaultValue: 50,
    disabled: false,
    formatOptions: "hidden",
    id: "volume",
    max: 100,
    min: 0,
    name: "volume",
    onChangeEnd: (value: number) => {
      void value;
    },
    step: 5,
    ticks: { count: 5, labels: true },
  } satisfies SliderProps;

  return (
    <>
      <Slider {...controlled} />
      <Slider {...uncontrolled} />
    </>
  );
}

// @ts-expect-error A value requires the canonical onChange callback.
const missingChange: SliderProps = { value: 5 };
// @ts-expect-error Uncontrolled sliders cannot accept onChange.
const uncontrolledChange: SliderProps = {
  defaultValue: 5,
  onChange: (value: number) => {
    void value;
  },
};
void missingChange;
void uncontrolledChange;
