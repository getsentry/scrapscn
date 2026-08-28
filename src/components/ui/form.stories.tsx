import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";

import { AutoSaveForm, defaultFormOptions, FieldGroup, useScrapsForm } from "./form";

const meta = {
  title: "Components/Form",
  component: FieldGroup,
  parameters: { layout: "padded" },
} satisfies Meta<typeof FieldGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Composition: Story = {
  render: function FormCompositionStory() {
    const [submittedName, setSubmittedName] = useState("Not submitted");
    const form = useScrapsForm({
      ...defaultFormOptions,
      defaultValues: { name: "Frontend" },
      formId: "form-story",
      onSubmit: ({ value }) => setSubmittedName(value.name),
      validators: {
        onBlur: z.object({
          name: z.string().min(3, "Use at least three characters"),
        }),
      },
    });

    return (
      <div className="max-w-xl space-y-4">
        <form.AppForm form={form}>
          <FieldGroup title="Project">
            <form.AppField name="name">
              {(field) => (
                <field.Layout.Row hintText="Shown to team members" label="Name" required>
                  <field.Input onChange={field.handleChange} value={field.state.value} />
                </field.Layout.Row>
              )}
            </form.AppField>
          </FieldGroup>
          <div className="mt-4 flex gap-2">
            <form.ResetButton>Reset</form.ResetButton>
            <form.SubmitButton>Save</form.SubmitButton>
          </div>
        </form.AppForm>
        <p className="text-sm text-muted-foreground">Saved name: {submittedName}</p>
      </div>
    );
  },
};

export const AutoSave: Story = {
  render: function AutoSaveStory() {
    const [queryClient] = useState(
      () => new QueryClient({ defaultOptions: { mutations: { retry: false } } }),
    );
    const [savedName, setSavedName] = useState("Frontend");

    return (
      <QueryClientProvider client={queryClient}>
        <div className="max-w-xl space-y-3">
          <AutoSaveForm
            initialValue={savedName}
            mutationOptions={{
              mutationFn: async ({ name }: { name: string }) => {
                setSavedName(name);
                return { name };
              },
            }}
            name="name"
            schema={z.object({
              name: z.string().min(3, "Use at least three characters"),
            })}
          >
            {(field) => (
              <field.Layout.Row hintText="Blur the field to save" label="Auto-save name">
                <field.Input onChange={field.handleChange} value={field.state.value} />
              </field.Layout.Row>
            )}
          </AutoSaveForm>
          <p className="text-sm text-muted-foreground">Last saved: {savedName}</p>
        </div>
      </QueryClientProvider>
    );
  },
};
