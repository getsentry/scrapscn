"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  createFormHook,
  formOptions,
  revalidateLogic,
  useStore,
  type AnyFormApi,
  type DeepKeys,
  type DeepValue,
  type FieldApi,
} from "@tanstack/react-form";
import { useMutation, type UseMutationOptions } from "@tanstack/react-query";
import { useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import type { z } from "zod";

import { Button, type ButtonProps } from "./button";
import { AutoSaveContextProvider } from "./form-auto-save-context";
import {
  fieldContext,
  FormElementContext,
  formContext,
  useFormContext,
  useIsInsideFormElement,
} from "./form-context";
import { fieldComponents } from "./form-fields";

export const defaultFormOptions = formOptions({
  onSubmitInvalid({
    formApi,
  }: {
    formApi: { formId: string; validateSync: (cause: "submit") => unknown };
  }) {
    formApi.validateSync("submit");
    const invalid = document.querySelector<HTMLInputElement>(
      `#${CSS.escape(formApi.formId)} [aria-invalid="true"]`,
    );
    invalid?.focus();
  },
  validationLogic: revalidateLogic({ mode: "submit", modeAfterSubmission: "change" }),
});

function SubmitButton(props: ButtonProps) {
  const form = useFormContext();
  const insideForm = useIsInsideFormElement();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button
          {...props}
          busy={isSubmitting || props.busy}
          disabled={isSubmitting || props.disabled}
          form={insideForm ? undefined : form.formId}
          type="submit"
          variant="primary"
        />
      )}
    </form.Subscribe>
  );
}

function ResetButton(props: ButtonProps) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isPristine}>
      {(isPristine) => (
        <Button
          {...props}
          disabled={props.disabled || isPristine}
          onClick={(event) => {
            form.reset();
            props.onClick?.(event);
          }}
          type="button"
        />
      )}
    </form.Subscribe>
  );
}

function AppForm({ children, form }: { children: ReactNode; form: AnyFormApi }) {
  return (
    <formContext.Provider value={form}>
      <FormWrapper>{children}</FormWrapper>
    </formContext.Provider>
  );
}

function FormWrapper({ children }: { children: ReactNode }) {
  const form = useFormContext();
  return (
    <form
      className="w-full"
      data-test-id={form.formId}
      id={form.formId}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FormElementContext.Provider value>{children}</FormElementContext.Provider>
    </form>
  );
}

const hooks = createFormHook({
  fieldComponents,
  formComponents: { AppForm, FieldGroup, ResetButton, SubmitButton },
  fieldContext,
  formContext,
});

export const useScrapsForm = hooks.useAppForm;
export const withFieldGroup = hooks.withFieldGroup;
export const withForm = hooks.withForm;
export { formOptions, useStore };

type FieldErrors<Data> = Partial<Record<DeepKeys<Data>, { message: string }>>;
type InferFormData<Form> = Form extends { state: { values: infer Data } } ? Data : never;
type ResponseError = Error & {
  responseJSON?: Record<string, unknown> | unknown[];
  status?: number;
};

const REQUEST_ERROR_NAMES = new Set([
  "RequestError",
  "CancelledError",
  "UndefinedResponseBodyError",
  "BadRequestError",
  "UnauthorizedError",
  "ForbiddenError",
  "NotFoundError",
  "URITooLongError",
  "UpgradeRequiredError",
  "TooManyRequestsError",
  "InternalServerError",
  "NotImplementedError",
  "BadGatewayError",
  "ServiceUnavailableError",
  "GatewayTimeoutError",
]);

function isRequestError(error: unknown): error is ResponseError {
  return error instanceof Error && REQUEST_ERROR_NAMES.has(error.name);
}

function getRequestErrorUserMessage(error: ResponseError): string {
  const response = Array.isArray(error.responseJSON) ? error.responseJSON[0] : error.responseJSON;
  const detail =
    response && typeof response === "object"
      ? "detail" in response
        ? response.detail
        : "details" in response
          ? response.details
          : undefined
      : undefined;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (
    detail &&
    typeof detail === "object" &&
    "message" in detail &&
    typeof detail.message === "string" &&
    detail.message.trim()
  )
    return detail.message;
  switch (error.status) {
    case 429:
      return "API requests have been temporarily rate-limited. Please wait a few minutes and try again.";
    case 401:
      return "Authentication is required to load this data.";
    case 403:
      return "You do not have permission to load this data.";
    case 404:
      return "The requested data could not be found.";
    case 500:
      return "The server encountered an error while processing this request.";
    case 502:
    case 503:
      return "The server is temporarily unavailable. Please try again in a few moments.";
    case 504:
      return "The request timed out. Please try again.";
    default:
      return "Failed to save";
  }
}

export function setFieldErrors<
  Form extends { setErrorMap: (...args: never[]) => unknown; state: { values: unknown } },
>(formApi: Form, errors: FieldErrors<InferFormData<Form>> | ResponseError): boolean {
  if (errors instanceof Error) {
    if (!isRequestError(errors)) return false;
    const responseJSON = errors.responseJSON;
    if (!responseJSON) return false;
    const response = Array.isArray(responseJSON) ? responseJSON[0] : responseJSON;
    if (!response || typeof response !== "object") return false;
    const values = formApi.state.values;
    const fields: Record<string, { message: string }> = {};
    for (const [key, value] of Object.entries(response)) {
      if (typeof values !== "object" || values === null || !(key in values)) continue;
      if (typeof value === "string") fields[key] = { message: value };
      else if (Array.isArray(value) && value.length > 0)
        fields[key] = { message: String(value[0]) };
    }
    if (Object.keys(fields).length === 0) return false;
    formApi.setErrorMap({ onSubmit: { fields } } as never);
    return true;
  }
  formApi.setErrorMap({ onSubmit: { fields: errors } } as never);
  return true;
}

export function FieldGroup({
  children,
  hasButtons,
  title,
}: {
  children: ReactNode;
  hasButtons?: boolean;
  title?: ReactNode;
}) {
  return (
    <section
      className="overflow-hidden rounded-md border border-border bg-background"
      data-has-buttons={hasButtons || undefined}
    >
      {title ? (
        <header className="flex min-h-10 items-center border-b border-border bg-muted/40 px-4 text-sm font-semibold">
          {title}
        </header>
      ) : null}
      <div className="divide-y divide-border [&>*]:p-4">{children}</div>
    </section>
  );
}

export function FormSearch({ children }: { children: ReactNode; route: string }) {
  return children;
}

type AutoSaveField<
  Schema extends z.ZodObject,
  Name extends Extract<DeepKeys<z.input<Schema>>, string>,
> = FieldApi<
  z.input<Schema>,
  Name,
  DeepValue<z.input<Schema>, Name>,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  unknown
> &
  typeof fieldComponents;

type AutoSaveFormProps<
  Data,
  Context,
  Schema extends z.ZodObject,
  Name extends Extract<keyof z.input<Schema>, string>,
> = {
  children: (field: AutoSaveField<Schema, Name>) => ReactElement | null;
  initialValue: z.input<Schema>[Name];
  mutationOptions: UseMutationOptions<
    Data,
    Error,
    NoInfer<Record<Name, z.output<Schema>[Name]>>,
    Context
  >;
  name: Name;
  schema: Schema;
  confirm?: ReactNode | ((value: z.input<Schema>[Name]) => ReactNode | undefined);
};

export function AutoSaveForm<
  Data,
  Context,
  Schema extends z.ZodObject,
  Name extends Extract<keyof z.input<Schema>, string>,
>({
  children,
  confirm,
  initialValue,
  mutationOptions,
  name,
  schema,
}: AutoSaveFormProps<Data, Context, Schema, Name>) {
  const id = useId();
  const confirmationDescriptionId = `${id}-confirmation-description`;
  const confirmationTitleId = `${id}-confirmation-title`;
  const mutation = useMutation(mutationOptions);
  const confirmationTriggerRef = useRef<HTMLElement | null>(null);
  const pendingConfirmRef = useRef(false);
  const resetOnErrorRef = useRef(false);
  const [confirmation, setConfirmation] = useState<{
    cancel: () => void;
    confirm: () => void;
    message: ReactNode;
  } | null>(null);
  const form = useScrapsForm({
    ...defaultFormOptions,
    defaultValues: { [name]: initialValue } as Record<Name, z.input<Schema>[Name]>,
    formId: `${name}-${id}-(auto-save)`,
    listeners: {
      onBlur: ({ formApi, fieldApi }) => {
        if (!fieldApi.state.meta.isDefaultValue) void formApi.handleSubmit();
      },
    },
    onSubmit: async ({ value, formApi }) => {
      if (mutation.status === "pending" || pendingConfirmRef.current) return;
      const parsed = schema.pick({ [name]: true } as never).safeParse(value);
      if (!parsed.success) return;
      const submit = async () => {
        try {
          await mutation.mutateAsync(parsed.data as Record<Name, z.output<Schema>[Name]>);
          formApi.reset();
        } catch (error) {
          if (resetOnErrorRef.current) formApi.reset();
          if (!setFieldErrors(formApi as never, error as ResponseError)) {
            setFieldErrors(
              formApi as never,
              {
                [name]: {
                  message: isRequestError(error)
                    ? getRequestErrorUserMessage(error)
                    : "Failed to save",
                },
              } as never,
            );
          }
        }
      };
      const message = typeof confirm === "function" ? confirm(value[name]) : confirm;
      if (!message) {
        await submit();
        return;
      }
      pendingConfirmRef.current = true;
      confirmationTriggerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      await new Promise<void>((resolve) => {
        setConfirmation({
          cancel: () => {
            pendingConfirmRef.current = false;
            setConfirmation(null);
            formApi.reset();
            resolve();
          },
          confirm: () => {
            pendingConfirmRef.current = false;
            setConfirmation(null);
            void submit().finally(resolve);
          },
          message,
        });
      });
    },
    validators: { onChange: schema.pick({ [name]: true } as never) as never },
  });
  return (
    <form.AppForm form={form as never}>
      <AutoSaveContextProvider value={{ resetOnErrorRef, status: mutation.status }}>
        <form.AppField name={name}>{(field) => children(field as never)}</form.AppField>
      </AutoSaveContextProvider>
      <DialogPrimitive.Root
        onOpenChange={(open) => {
          if (!open) confirmation?.cancel();
        }}
        open={Boolean(confirmation)}
      >
        {confirmation ? (
          <DialogPrimitive.Portal>
            <DialogPrimitive.Backdrop
              className="fixed inset-0 z-[10000] bg-black/50"
              data-testid="auto-save-confirmation-backdrop"
            />
            <DialogPrimitive.Popup
              aria-describedby={confirmationDescriptionId}
              aria-labelledby={confirmationTitleId}
              className="fixed top-1/2 left-1/2 z-[10000] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-md border border-border bg-background p-6 shadow-xl outline-none"
              finalFocus={() => confirmationTriggerRef.current}
            >
              <DialogPrimitive.Title className="sr-only" id={confirmationTitleId}>
                Confirm change
              </DialogPrimitive.Title>
              <DialogPrimitive.Description
                className="text-sm text-foreground"
                id={confirmationDescriptionId}
              >
                {confirmation.message}
              </DialogPrimitive.Description>
              <div className="mt-6 flex justify-end gap-2">
                <Button autoFocus onClick={confirmation.cancel} type="button">
                  Cancel
                </Button>
                <Button onClick={confirmation.confirm} type="button" variant="danger">
                  Confirm
                </Button>
              </div>
            </DialogPrimitive.Popup>
          </DialogPrimitive.Portal>
        ) : null}
      </DialogPrimitive.Root>
    </form.AppForm>
  );
}

export { AutoSaveContextProvider };
