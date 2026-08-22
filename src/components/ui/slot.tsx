"use client";

import {
  createContext,
  use,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type Context,
  type ComponentType,
  type Dispatch,
  type FunctionComponent,
  type ReactNode,
  type Reducer,
  type RefCallback,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import * as Sentry from "@sentry/react";

import { ContainerQueryContext } from "./container-query-context";
import { SizeContext } from "./size-context";

const NOOP_REF_CALLBACK: RefCallback<HTMLElement | null> = () => {};
const EMPTY_STATE: SlotReducerState<string> = {};
const NOOP_DISPATCH: Dispatch<SlotReducerAction<string>> = () => {};
const KNOWN_BRIDGED_CONTEXTS = [SizeContext, ContainerQueryContext] as const;
const reportedSlotWarnings = new Set<string>();

type SlotName = string;
type ContextBridge = { context: Context<unknown>; value: unknown };
type SlotValue = {
  contextBridges: ContextBridge[];
  counter: number;
  element: HTMLElement | null;
};
type SlotReducerState<T extends SlotName> = Partial<Record<T, SlotValue>>;
type SlotReducerAction<T extends SlotName> =
  | { name: T; type: "increment counter" }
  | { name: T; type: "decrement counter" }
  | { element: HTMLElement | null; name: T; type: "register" }
  | { name: T; type: "unregister" }
  | { contextBridges: ContextBridge[]; name: T; type: "set context bridges" }
  | { name: T; type: "remove context bridges" };
type SlotContextValue<T extends SlotName> = [
  SlotReducerState<T>,
  Dispatch<SlotReducerAction<T>>,
];

interface SlotProviderProps {
  children: ReactNode;
}

interface SlotConsumerProps<T extends SlotName> {
  children: ReactNode;
  name: T;
}

interface SlotOutletProps<T extends SlotName> {
  children: (
    props: { ref: RefCallback<HTMLElement | null> },
    hasConsumers: boolean
  ) => ReactNode;
  name: T;
}

interface SlotFallbackProps {
  children: ReactNode;
}

type SlotModule<T extends SlotName> = FunctionComponent<SlotConsumerProps<T>> & {
  Fallback: FunctionComponent<SlotFallbackProps>;
  Outlet: FunctionComponent<SlotOutletProps<T>>;
  Provider: FunctionComponent<SlotProviderProps>;
  useSlotOutletRef: () => RefObject<HTMLElement | null>;
};

function reportSlotWarning(
  component: "Consumer" | "Fallback" | "Outlet",
  name: string
): void {
  const key = `missing-provider:${component}:${name}`;
  if (reportedSlotWarnings.has(key)) return;
  reportedSlotWarnings.add(key);

  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `<Slot.${component}> for slot "${name}" rendered without a <Slot.Provider>`
    );
    return;
  }
  const message = `<Slot.${component}> for slot "${name}" rendered without a <Slot.Provider>`;
  Sentry.withScope((scope) => {
    scope.setLevel("warning");
    scope.setTag("slot.component", component);
    scope.setTag("slot.name", name);
    scope.setFingerprint(["slot-missing-provider", component, name]);
    Sentry.captureException(new Error(message));
  });
}

function makeSlotReducer<T extends SlotName>(): Reducer<
  SlotReducerState<T>,
  SlotReducerAction<T>
> {
  return (state, action) => {
    const currentSlot = state[action.name];
    switch (action.type) {
      case "increment counter":
        return {
          ...state,
          [action.name]: {
            contextBridges: currentSlot?.contextBridges ?? [],
            counter: (currentSlot?.counter ?? 0) + 1,
            element: currentSlot?.element ?? null,
          },
        };
      case "decrement counter":
        if (!currentSlot) return state;
        return {
          ...state,
          [action.name]: { ...currentSlot, counter: currentSlot.counter - 1 },
        };
      case "register":
        return {
          ...state,
          [action.name]: {
            contextBridges: currentSlot?.contextBridges ?? [],
            counter: currentSlot?.counter ?? 0,
            element: action.element,
          },
        };
      case "unregister":
        if (!currentSlot) return state;
        return {
          ...state,
          [action.name]: { ...currentSlot, element: null },
        };
      case "set context bridges":
        return {
          ...state,
          [action.name]: {
            contextBridges: action.contextBridges,
            counter: currentSlot?.counter ?? 0,
            element: currentSlot?.element ?? null,
          },
        };
      case "remove context bridges":
        return {
          ...state,
          [action.name]: {
            contextBridges: [],
            counter: currentSlot?.counter ?? 0,
            element: currentSlot?.element ?? null,
          },
        };
    }
  };
}

function useContextBridges(): ContextBridge[] {
  const values = KNOWN_BRIDGED_CONTEXTS.map((context) =>
    use(context as Context<unknown>)
  );
  const [previousBridges, setPreviousBridges] = useState<ContextBridge[]>([]);
  const changed =
    previousBridges.length !== KNOWN_BRIDGED_CONTEXTS.length ||
    previousBridges.some((bridge, index) => bridge.value !== values[index]);

  if (!changed) return previousBridges;
  const nextBridges = KNOWN_BRIDGED_CONTEXTS.map((context, index) => ({
    context: context as Context<unknown>,
    value: values[index],
  }));
  setPreviousBridges(nextBridges);
  return nextBridges;
}

function makeSlotConsumer<T extends SlotName>(
  context: Context<SlotContextValue<T> | null>,
  outletNameContext: Context<T | null>
) {
  function SlotConsumer({ name, children }: SlotConsumerProps<T>): ReactNode {
    const slotContext = useContext(context);
    const [state, dispatch] = slotContext ?? [EMPTY_STATE, NOOP_DISPATCH];
    const element = state[name]?.element;

    useLayoutEffect(() => {
      if (dispatch === NOOP_DISPATCH) return;
      dispatch({ type: "increment counter", name });
      return () => dispatch({ type: "decrement counter", name });
    }, [dispatch, name]);

    if (!slotContext) {
      reportSlotWarning("Consumer", name);
      return null;
    }
    if (!element) return null;

    let content: ReactNode = (
      <outletNameContext.Provider value={name}>
        {children}
      </outletNameContext.Provider>
    );
    content = (state[name]?.contextBridges ?? [])
      .toReversed()
      .reduce(
        (portaledChildren, bridge) => (
          <bridge.context value={bridge.value}>{portaledChildren}</bridge.context>
        ),
        content
      );
    return createPortal(content, element);
  }

  SlotConsumer.displayName = "Slot.Consumer";
  return SlotConsumer;
}

function makeSlotOutlet<T extends SlotName>(
  context: Context<SlotContextValue<T> | null>,
  outletNameContext: Context<T | null>
) {
  function SlotOutlet({ name, children }: SlotOutletProps<T>): ReactNode {
    const slotContext = useContext(context);
    const [, dispatch] = slotContext ?? [EMPTY_STATE, NOOP_DISPATCH];
    const contextBridges = useContextBridges();

    useLayoutEffect(() => {
      dispatch({ type: "set context bridges", name, contextBridges });
      return () => dispatch({ type: "remove context bridges", name });
    }, [contextBridges, dispatch, name]);

    const ref = useCallback(
      (element: HTMLElement | null) => {
        if (dispatch === NOOP_DISPATCH) return;
        dispatch(
          element
            ? { type: "register", name, element }
            : { type: "unregister", name }
        );
      },
      [dispatch, name]
    );

    if (!slotContext) {
      reportSlotWarning("Outlet", name);
      return children({ ref: NOOP_REF_CALLBACK }, false);
    }
    return (
      <outletNameContext.Provider value={name}>
        {children({ ref }, (slotContext[0][name]?.counter ?? 0) > 0)}
      </outletNameContext.Provider>
    );
  }

  SlotOutlet.displayName = "Slot.Outlet";
  return SlotOutlet;
}

function makeSlotFallback<T extends SlotName>(
  context: Context<SlotContextValue<T> | null>,
  outletNameContext: Context<T | null>
) {
  function SlotFallback({ children }: SlotFallbackProps): ReactNode {
    const slotContext = useContext(context);
    const name = useContext(outletNameContext);
    if (!slotContext) {
      reportSlotWarning("Fallback", name ?? "unknown");
      return null;
    }
    if (name === null) {
      throw new Error("Slot.Fallback must be rendered inside Slot.Outlet");
    }
    const slotValue = slotContext[0][name];
    if ((slotValue?.counter ?? 0) > 0 || !slotValue?.element) return null;
    return createPortal(children, slotValue.element);
  }

  SlotFallback.displayName = "Slot.Fallback";
  return SlotFallback;
}

function makeSlotProvider<T extends SlotName>(
  context: Context<SlotContextValue<T> | null>
) {
  const reducer = makeSlotReducer<T>();
  function SlotProvider({ children }: SlotProviderProps): ReactNode {
    const [state, dispatch] = useReducer(reducer, {});
    const value = useMemo(
      () => [state, dispatch] as SlotContextValue<T>,
      [state, dispatch]
    );
    return <context.Provider value={value}>{children}</context.Provider>;
  }

  SlotProvider.displayName = "Slot.Provider";
  return SlotProvider;
}

function makeUseSlotOutletRef<T extends SlotName>(
  context: Context<SlotContextValue<T> | null>,
  outletNameContext: Context<T | null>
) {
  return function useSlotOutletRef(): RefObject<HTMLElement | null> {
    const slotContext = useContext(context);
    const name = useContext(outletNameContext);
    const ref = useRef<HTMLElement | null>(null);
    ref.current = slotContext && name ? slotContext[0][name]?.element ?? null : null;
    return ref;
  };
}

/** Creates a typed portal slot system with Provider, Outlet, and Fallback components. */
export function slot<T extends readonly SlotName[]>(names: T): SlotModule<T[number]> {
  type Name = T[number];
  const context = createContext<SlotContextValue<Name> | null>(null);
  const outletNameContext = createContext<Name | null>(null);
  const Slot = makeSlotConsumer(context, outletNameContext) as SlotModule<Name>;
  Slot.Provider = makeSlotProvider(context);
  Slot.Outlet = makeSlotOutlet(context, outletNameContext);
  Slot.Fallback = makeSlotFallback(context, outletNameContext);
  Slot.useSlotOutletRef = makeUseSlotOutletRef(context, outletNameContext);
  void names;
  return Slot;
}

/** Attaches a Slot module to a component without changing the component identity. */
export function withSlots<
  // The wrapped component preserves its own props exactly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TComponent extends ComponentType<any>,
  TSlot extends SlotName,
>(
  Component: TComponent,
  slotModule: SlotModule<TSlot>
): TComponent & { Slot: SlotModule<TSlot> } {
  const componentWithSlots = Component as TComponent & { Slot: SlotModule<TSlot> };
  componentWithSlots.Slot = slotModule;
  return componentWithSlots;
}
