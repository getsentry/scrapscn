import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  AutoSaveForm,
  FieldGroup,
  FormSearch,
  defaultFormOptions,
  setFieldErrors,
  useScrapsForm,
} from "./form";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const roots: ReturnType<typeof createRoot>[] = [];

beforeEach(() => {
  if (typeof globalThis.CSS === "undefined") {
    Object.defineProperty(globalThis, "CSS", {
      configurable: true,
      value: { escape: (value: string) => value.replace(/([^\w-])/g, "\\$1") },
    });
  } else if (typeof CSS.escape !== "function") {
    Object.defineProperty(CSS, "escape", {
      configurable: true,
      value: (value: string) => value.replace(/([^\w-])/g, "\\$1"),
    });
  }
});

async function render(node: ReactNode) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  roots.push(root);
  await act(async () => root.render(node));
  return container;
}

afterEach(async () => {
  await act(async () => roots.splice(0).forEach((root) => root.unmount()));
  document.body.replaceChildren();
});

describe("Form", () => {
  it("binds canonical field, layout, submit, and reset components", async () => {
    const onSubmit = vi.fn();
    function Demo() {
      const form = useScrapsForm({
        ...defaultFormOptions,
        defaultValues: { name: "Frontend" },
        formId: "project-form",
        onSubmit: ({ value }) => onSubmit(value),
      });
      return (
        <form.AppForm form={form}>
          <FieldGroup title="Project">
            <form.AppField name="name">
              {(field) => (
                <field.Layout.Row hintText="Visible in Sentry" label="Name" required>
                  <field.Input onChange={field.handleChange} value={field.state.value} />
                </field.Layout.Row>
              )}
            </form.AppField>
          </FieldGroup>
          <form.ResetButton>Reset</form.ResetButton>
          <form.SubmitButton>Save</form.SubmitButton>
        </form.AppForm>
      );
    }
    const container = await render(<Demo />);
    const input = container.querySelector<HTMLInputElement>("input")!;
    expect(input.id).toBe("project-formname");
    expect(input.getAttribute("aria-describedby")).toBe("project-formname-hint");
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "Relay");
    await act(async () => input.dispatchEvent(new Event("input", { bubbles: true })));
    await act(async () => container.querySelector<HTMLFormElement>("form")?.requestSubmit());
    expect(onSubmit).toHaveBeenCalledWith({ name: "Relay" });
    await act(async () =>
      container.querySelector<HTMLButtonElement>('button[type="button"]')?.click(),
    );
    expect(input.value).toBe("Frontend");
  });

  it("reports BaseField validation state and disabled help", async () => {
    function Demo() {
      const form = useScrapsForm({
        ...defaultFormOptions,
        defaultValues: { locked: "", name: "ab" },
        formId: "field-state",
        validators: {
          onBlur: z.object({
            locked: z.string(),
            name: z.string().min(3, "At least three characters"),
          }),
        },
      });
      return (
        <form.AppForm form={form}>
          <form.AppField name="name">
            {(field) => (
              <field.Input
                aria-label="Field state"
                onChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.AppField>
          <form.AppField name="locked">
            {(field) => (
              <field.Input
                aria-label="Locked field"
                disabled="Locked by policy"
                onChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.AppField>
        </form.AppForm>
      );
    }
    const container = await render(<Demo />);
    const input = container.querySelector<HTMLInputElement>("input")!;
    expect(input.getAttribute("aria-invalid")).toBe("false");
    await act(async () => {
      input.focus();
      input.blur();
    });
    await vi.waitFor(() => expect(input.getAttribute("aria-invalid")).toBe("true"));
    await vi.waitFor(() =>
      expect(container.querySelector('[aria-label="Field error"]')).not.toBeNull(),
    );
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe("Field error");
    await vi.waitFor(() =>
      expect(document.querySelector('[role="tooltip"]')?.textContent).toContain(
        "At least three characters",
      ),
    );
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "valid");
    await act(async () => input.dispatchEvent(new Event("input", { bubbles: true })));
    await act(async () => {
      input.focus();
      input.blur();
    });
    await vi.waitFor(() => expect(input.getAttribute("aria-invalid")).toBe("false"));
    expect(container.querySelector<HTMLInputElement>('[aria-label="Locked field"]')?.disabled).toBe(
      true,
    );
    const disabledTip = container.querySelector<HTMLElement>('[aria-label="Disabled"]')!;
    await act(async () => disabledTip.focus());
    await vi.waitFor(() => expect(document.body.textContent).toContain("Locked by policy"));
  });

  it("sets manual and recognized request field errors only", () => {
    const setErrorMap = vi.fn();
    const form = { setErrorMap, state: { values: { name: "Frontend" } } };
    expect(setFieldErrors(form as never, { name: { message: "Taken" } })).toBe(true);
    const error = Object.assign(new Error("Invalid"), {
      name: "BadRequestError",
      responseJSON: { ignored: "No", name: ["Required"] },
    });
    expect(setFieldErrors(form as never, error)).toBe(true);
    expect(setErrorMap).toHaveBeenLastCalledWith({
      onSubmit: { fields: { name: { message: "Required" } } },
    });
    const generic = Object.assign(new Error("Invalid"), { responseJSON: { name: "Required" } });
    expect(setFieldErrors(form as never, generic)).toBe(false);
    expect(
      setFieldErrors(
        form as never,
        Object.assign(new Error("Invalid"), {
          name: "RequestError",
          responseJSON: [{ name: "Array error" }],
        }),
      ),
    ).toBe(true);
    expect(setErrorMap).toHaveBeenLastCalledWith({
      onSubmit: { fields: { name: { message: "Array error" } } },
    });
  });

  it.each([
    [{ detail: "Server detail" }, undefined, "Server detail"],
    [{ details: { message: "Structured detail" } }, undefined, "Structured detail"],
    [[{ detail: "Array detail" }], undefined, "Array detail"],
    [
      {},
      429,
      "API requests have been temporarily rate-limited. Please wait a few minutes and try again.",
    ],
    [{}, 504, "The request timed out. Please try again."],
  ])("uses the canonical request error message for %o", async (responseJSON, status, message) => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const mutationFn = vi.fn(async () => {
      throw Object.assign(new Error("ignored"), { name: "RequestError", responseJSON, status });
    });
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AutoSaveForm
          initialValue="Frontend"
          mutationOptions={{ mutationFn }}
          name="name"
          schema={z.object({ name: z.string() })}
        >
          {(field) => (
            <field.Input
              aria-label="Request error name"
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </AutoSaveForm>
      </QueryClientProvider>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "Relay");
    await act(async () => input.dispatchEvent(new Event("input", { bubbles: true })));
    await act(async () => {
      input.focus();
      input.blur();
    });
    await vi.waitFor(() => expect(document.body.textContent).toContain(message));
    queryClient.clear();
  });

  it("uses the fallback for generic errors, including response details", async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const mutationFn = vi.fn(async () => {
      throw Object.assign(new Error("Do not show this"), { responseJSON: { detail: "Nor this" } });
    });
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AutoSaveForm
          initialValue="Frontend"
          mutationOptions={{ mutationFn }}
          name="name"
          schema={z.object({ name: z.string() })}
        >
          {(field) => (
            <field.Input
              aria-label="Generic error name"
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </AutoSaveForm>
      </QueryClientProvider>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "Relay");
    await act(async () => input.dispatchEvent(new Event("input", { bubbles: true })));
    await act(async () => {
      input.focus();
      input.blur();
    });
    await vi.waitFor(() => expect(document.body.textContent).toContain("Failed to save"));
    expect(document.body.textContent).not.toContain("Do not show this");
    expect(document.body.textContent).not.toContain("Nor this");
    queryClient.clear();
  });

  it("keeps FormSearch runtime-transparent", async () => {
    const container = await render(
      <FormSearch route="/settings/project/">
        <span>Searchable field</span>
      </FormSearch>,
    );
    expect(container.innerHTML).toBe("<span>Searchable field</span>");
  });

  it("submits a changed AutoSaveForm field on blur", async () => {
    const mutationFn = vi.fn(async (value: { name: string }) => value);
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
    });
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AutoSaveForm
          initialValue="Frontend"
          mutationOptions={{ mutationFn }}
          name="name"
          schema={z.object({ name: z.string().min(1) })}
        >
          {(field) => (
            <field.Input
              aria-label="Auto-save name"
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        </AutoSaveForm>
      </QueryClientProvider>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(input, "Relay");
    await act(async () => input.dispatchEvent(new Event("input", { bubbles: true })));
    await act(async () => {
      input.focus();
      input.blur();
    });
    await vi.waitFor(() =>
      expect(mutationFn).toHaveBeenCalledWith({ name: "Relay" }, expect.anything()),
    );
    await vi.waitFor(() =>
      expect(container.querySelector('[role="status"]')?.getAttribute("aria-label")).toBe("Saved"),
    );
    queryClient.clear();
  });

  it("uses a cancel-first React confirmation dialog before auto-saving", async () => {
    const mutationFn = vi.fn(async (value: { enabled: boolean }) => value);
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AutoSaveForm
          confirm={<strong>Enable protection?</strong>}
          initialValue={false}
          mutationOptions={{ mutationFn }}
          name="enabled"
          schema={z.object({ enabled: z.boolean() })}
        >
          {(field) => (
            <field.Switch
              aria-label="Protection"
              checked={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </AutoSaveForm>
      </QueryClientProvider>,
    );
    const input = container.querySelector<HTMLInputElement>('input[type="checkbox"]')!;
    await act(async () => input.click());
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog.textContent).toContain("Enable protection?");
    expect(document.getElementById(dialog.getAttribute("aria-labelledby")!)?.textContent).toBe(
      "Confirm change",
    );
    expect(document.getElementById(dialog.getAttribute("aria-describedby")!)?.textContent).toBe(
      "Enable protection?",
    );
    expect(document.activeElement?.textContent).toBe("Cancel");
    expect(mutationFn).not.toHaveBeenCalled();
    await act(async () =>
      [...dialog.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent === "Confirm")
        ?.click(),
    );
    await vi.waitFor(() =>
      expect(mutationFn).toHaveBeenCalledWith({ enabled: true }, expect.anything()),
    );
    queryClient.clear();
  });

  it("cancels confirmation by Escape or backdrop without mutating", async () => {
    const mutationFn = vi.fn(async (value: { enabled: boolean }) => value);
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AutoSaveForm
          confirm="Confirm change"
          initialValue={false}
          mutationOptions={{ mutationFn }}
          name="enabled"
          schema={z.object({ enabled: z.boolean() })}
        >
          {(field) => (
            <field.Switch
              aria-label="Cancel confirmation"
              checked={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </AutoSaveForm>
      </QueryClientProvider>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    await act(async () => input.click());
    await act(async () =>
      document.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })),
    );
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(document.activeElement).toBe(input);
    expect(input.checked).toBe(false);
    expect(mutationFn).not.toHaveBeenCalled();
    await act(async () => input.click());
    const backdrop = document.querySelector<HTMLElement>(
      '[data-testid="auto-save-confirmation-backdrop"]',
    )!;
    await act(async () => backdrop.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    await vi.waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeNull());
    expect(input.checked).toBe(false);
    expect(mutationFn).not.toHaveBeenCalled();
    queryClient.clear();
  });

  it("keeps confirmation open for dialog clicks and resolves rejected confirmed saves", async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const mutationFn = vi.fn(async () => {
      throw Object.assign(new Error("ignored"), {
        name: "RequestError",
        responseJSON: { detail: "Rejected change" },
      });
    });
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AutoSaveForm
          confirm="Confirm change"
          initialValue={false}
          mutationOptions={{ mutationFn }}
          name="enabled"
          schema={z.object({ enabled: z.boolean() })}
        >
          {(field) => (
            <field.Switch
              aria-label="Rejected confirmation"
              checked={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </AutoSaveForm>
      </QueryClientProvider>,
    );
    const input = container.querySelector<HTMLInputElement>("input")!;
    await act(async () => input.click());
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    await act(async () => dialog.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })));
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    await act(async () =>
      [...dialog.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent === "Confirm")
        ?.click(),
    );
    await vi.waitFor(() => expect(document.body.textContent).toContain("Rejected change"));
    expect(input.disabled).toBe(false);
    expect(input.checked).toBe(false);
    expect(mutationFn).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });

  it("binds every regular field component to TanStack field state", async () => {
    function Fields() {
      const form = useScrapsForm({
        ...defaultFormOptions,
        defaultValues: {
          count: 2 as number | null,
          enabled: true,
          notes: "Hello",
          password: "secret",
          project: "frontend",
          range: 40,
          radio: "first",
        },
        formId: "all-fields",
      });
      return (
        <form.AppForm form={form}>
          <form.AppField name="count">
            {(field) => (
              <field.Number
                aria-label="Count"
                onChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.AppField>
          <form.AppField name="password">
            {(field) => (
              <field.Password
                aria-label="Password"
                onChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.AppField>
          <form.AppField name="notes">
            {(field) => (
              <field.TextArea
                aria-label="Notes"
                onChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.AppField>
          <form.AppField name="enabled">
            {(field) => (
              <field.Switch
                aria-label="Enabled"
                checked={field.state.value}
                onChange={field.handleChange}
              />
            )}
          </form.AppField>
          <form.AppField name="range">
            {(field) => (
              <field.Range
                aria-label="Range"
                onChange={field.handleChange}
                value={field.state.value}
              />
            )}
          </form.AppField>
          <form.AppField name="project">
            {(field) => (
              <field.Select
                aria-label="Project"
                onChange={field.handleChange}
                options={[
                  { label: "Frontend", value: "frontend" },
                  { label: "Relay", value: "relay" },
                ]}
                value={field.state.value}
              />
            )}
          </form.AppField>
          <form.AppField name="radio">
            {(field) => (
              <field.Radio.Group onChange={field.handleChange} value={field.state.value}>
                <field.Radio.Item value="first">First</field.Radio.Item>
                <field.Radio.Item value="second">Second</field.Radio.Item>
              </field.Radio.Group>
            )}
          </form.AppField>
        </form.AppForm>
      );
    }
    const container = await render(<Fields />);
    expect(container.querySelector<HTMLInputElement>('[aria-label="Count"]')?.value).toBe("2");
    expect(container.querySelector<HTMLInputElement>('[aria-label="Password"]')?.type).toBe(
      "password",
    );
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[aria-label="Show password"]')?.click(),
    );
    expect(container.querySelector<HTMLInputElement>('[aria-label="Password"]')?.type).toBe("text");
    expect(container.querySelector<HTMLTextAreaElement>('[aria-label="Notes"]')?.value).toBe(
      "Hello",
    );
    expect(container.querySelector<HTMLInputElement>('[aria-label="Enabled"]')?.checked).toBe(true);
    expect(container.querySelector('[data-slot="slider-track-area"]')).not.toBeNull();
    expect(container.textContent).toContain("Frontend");
    expect(container.querySelectorAll('[type="radio"]')).toHaveLength(2);
  });

  it("binds SelectAsync to debounced TanStack Query options", async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    function AsyncField() {
      const form = useScrapsForm({
        defaultValues: { project: null as string | null },
        formId: "async-field",
      });
      return (
        <form.AppForm form={form}>
          <form.AppField name="project">
            {(field) => (
              <field.SelectAsync
                clearable
                defaultMenuIsOpen
                onChange={field.handleChange}
                queryOptions={(input) => ({
                  queryFn: async () => [{ label: `Frontend ${input}`, value: "frontend" }],
                  queryKey: ["projects", input],
                })}
                value={field.state.value}
              />
            )}
          </form.AppField>
        </form.AppForm>
      );
    }
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AsyncField />
      </QueryClientProvider>,
    );
    await vi.waitFor(() => expect(container.textContent).toContain("Frontend"));
    queryClient.clear();
  });

  it("resets failed auto-save toggles and exposes a field error", async () => {
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const mutationFn = vi.fn(async () => {
      throw new Error("No connection");
    });
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AutoSaveForm
          initialValue={false}
          mutationOptions={{ mutationFn }}
          name="enabled"
          schema={z.object({ enabled: z.boolean() })}
        >
          {(field) => (
            <field.Switch
              aria-label="Failure switch"
              checked={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </AutoSaveForm>
      </QueryClientProvider>,
    );
    const input = container.querySelector<HTMLInputElement>('[aria-label="Failure switch"]')!;
    await act(async () => input.click());
    await vi.waitFor(() => expect(input.checked).toBe(false));
    await vi.waitFor(() =>
      expect(container.querySelector('[aria-label="Field error"]')).not.toBeNull(),
    );
    queryClient.clear();
  });

  it("restores field focus after an auto-save temporarily disables it", async () => {
    let resolveMutation: (() => void) | undefined;
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AutoSaveForm
          initialValue={false}
          mutationOptions={{
            mutationFn: () =>
              new Promise<void>((resolve) => {
                resolveMutation = resolve;
              }),
          }}
          name="enabled"
          schema={z.object({ enabled: z.boolean() })}
        >
          {(field) => (
            <field.Switch
              aria-label="Focus switch"
              checked={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </AutoSaveForm>
      </QueryClientProvider>,
    );
    const input = container.querySelector<HTMLInputElement>('[aria-label="Focus switch"]')!;
    input.focus();
    await act(async () => input.click());
    await vi.waitFor(() => expect(input.disabled).toBe(true));
    expect(container.querySelector('[role="status"]')?.getAttribute("aria-label")).toBe(
      "Saving enabled",
    );
    input.blur();
    await act(async () => resolveMutation?.());
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    queryClient.clear();
  });

  it("restores select focus after a keyboard auto-save", async () => {
    const mutationFn = vi.fn(async (value: { fruit: string }) => value);
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AutoSaveForm
          initialValue="apple"
          mutationOptions={{ mutationFn }}
          name="fruit"
          schema={z.object({ fruit: z.string() })}
        >
          {(field) => (
            <field.Select
              aria-label="Fruit"
              onChange={field.handleChange}
              options={[
                { label: "Apple", value: "apple" },
                { label: "Banana", value: "banana" },
              ]}
              value={field.state.value}
            />
          )}
        </AutoSaveForm>
      </QueryClientProvider>,
    );
    const input = container.querySelector<HTMLInputElement>('[aria-label="Fruit"]')!;
    input.focus();
    await act(async () =>
      input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" })),
    );
    await act(async () =>
      input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" })),
    );
    await act(async () =>
      input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" })),
    );
    await vi.waitFor(() =>
      expect(mutationFn).toHaveBeenCalledWith({ fruit: "banana" }, expect.anything()),
    );
    await vi.waitFor(() => expect(document.activeElement).toBe(input));
    queryClient.clear();
  });

  it("waits for a multi-select menu to close before saving all selections", async () => {
    const mutationFn = vi.fn(async (value: { projects: string[] }) => value);
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AutoSaveForm
          initialValue={[]}
          mutationOptions={{ mutationFn }}
          name="projects"
          schema={z.object({ projects: z.array(z.string()) })}
        >
          {(field) => (
            <field.Select
              aria-label="Projects"
              multiple
              onChange={field.handleChange}
              options={[
                { label: "Frontend", value: "frontend" },
                { label: "Relay", value: "relay" },
              ]}
              value={field.state.value}
            />
          )}
        </AutoSaveForm>
      </QueryClientProvider>,
    );
    const input = container.querySelector<HTMLInputElement>('[aria-label="Projects"]')!;
    input.focus();
    await act(async () =>
      input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" })),
    );
    await act(async () =>
      container.querySelector<HTMLElement>('[data-test-id="frontend"]')?.click(),
    );
    expect(mutationFn).not.toHaveBeenCalled();
    await act(async () => container.querySelector<HTMLElement>('[data-test-id="relay"]')?.click());
    expect(mutationFn).not.toHaveBeenCalled();
    await act(async () =>
      input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })),
    );
    await vi.waitFor(() =>
      expect(mutationFn).toHaveBeenCalledWith(
        { projects: ["frontend", "relay"] },
        expect.anything(),
      ),
    );
    expect(mutationFn).toHaveBeenCalledTimes(1);
    queryClient.clear();
  });

  it("saves closed multi-select removal and clear once", async () => {
    const mutationFn = vi.fn(async (value: { projects: string[] }) => value);
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AutoSaveForm
          initialValue={["frontend", "relay"]}
          mutationOptions={{ mutationFn }}
          name="projects"
          schema={z.object({ projects: z.array(z.string()) })}
        >
          {(field) => (
            <field.Select
              aria-label="Closed projects"
              clearable
              multiple
              onChange={field.handleChange}
              options={[
                { label: "Frontend", value: "frontend" },
                { label: "Relay", value: "relay" },
              ]}
              value={field.state.value}
            />
          )}
        </AutoSaveForm>
      </QueryClientProvider>,
    );
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[aria-label="Remove item"]')?.click(),
    );
    await vi.waitFor(() =>
      expect(mutationFn).toHaveBeenCalledWith({ projects: ["relay"] }, expect.anything()),
    );
    expect(mutationFn).toHaveBeenCalledTimes(1);
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[aria-label="Clear choices"]')?.click(),
    );
    await vi.waitFor(() =>
      expect(mutationFn).toHaveBeenLastCalledWith({ projects: [] }, expect.anything()),
    );
    expect(mutationFn).toHaveBeenCalledTimes(2);
    queryClient.clear();
  });

  it("shows pending state and disables a multi-select while saving", async () => {
    let resolveMutation: (() => void) | undefined;
    const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const container = await render(
      <QueryClientProvider client={queryClient}>
        <AutoSaveForm
          initialValue={["frontend", "relay"]}
          mutationOptions={{
            mutationFn: () =>
              new Promise<void>((resolve) => {
                resolveMutation = resolve;
              }),
          }}
          name="projects"
          schema={z.object({ projects: z.array(z.string()) })}
        >
          {(field) => (
            <field.Select
              aria-label="Pending projects"
              multiple
              onChange={field.handleChange}
              options={[
                { label: "Frontend", value: "frontend" },
                { label: "Relay", value: "relay" },
              ]}
              value={field.state.value}
            />
          )}
        </AutoSaveForm>
      </QueryClientProvider>,
    );
    await act(async () =>
      container.querySelector<HTMLButtonElement>('[aria-label="Remove item"]')?.click(),
    );
    await vi.waitFor(() =>
      expect(container.querySelector('[role="status"]')?.getAttribute("aria-label")).toBe(
        "Saving projects",
      ),
    );
    expect(
      container.querySelector<HTMLInputElement>('[aria-label="Pending projects"]')?.disabled,
    ).toBe(true);
    await act(async () => resolveMutation?.());
    queryClient.clear();
  });
});
