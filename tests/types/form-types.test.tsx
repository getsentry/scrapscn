import {
  defaultFormOptions,
  formOptions,
  setFieldErrors,
  useScrapsForm,
  withFieldGroup,
  withForm,
} from "../../src/components/ui/form";

function Example() {
  const form = useScrapsForm({
    ...defaultFormOptions,
    defaultValues: { enabled: false, name: "Frontend", project: "frontend" },
    formId: "example",
    onSubmit: ({ value }) => value.name,
  });
  setFieldErrors(form, { name: { message: "Taken" } });
  return (
    <form.AppForm form={form}>
      <form.AppField name="name">
        {(field) => (
          <field.Layout.Row label="Name">
            <field.Input onChange={field.handleChange} value={field.state.value} />
          </field.Layout.Row>
        )}
      </form.AppField>
      <form.AppField name="enabled">
        {(field) => (
          <field.Layout.Row label="Enabled">
            <field.Switch checked={field.state.value} onChange={field.handleChange} />
          </field.Layout.Row>
        )}
      </form.AppField>
      <form.AppField name="project">
        {(field) => (
          <field.Layout.Row label="Project">
            <field.Select
              onChange={field.handleChange}
              options={[{ label: "Frontend", value: "frontend" }]}
              value={field.state.value}
            />
          </field.Layout.Row>
        )}
      </form.AppField>
      <form.ResetButton>Reset</form.ResetButton>
      <form.SubmitButton>Save</form.SubmitButton>
      <form.SubmitButton
        tooltipProps={{
          title: "Save",
          // @ts-expect-error Emotion SerializedStyles is an excluded portable input.
          overlayStyle: { name: "form", styles: "color:red;" },
        }}
      >
        Save
      </form.SubmitButton>
    </form.AppForm>
  );
}

void Example;
void formOptions;
void withFieldGroup;
void withForm;
