"use client";

import { createFormHookContexts } from "@tanstack/react-form";
import { createContext, useContext } from "react";

const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

const FormElementContext = createContext(false);
const useIsInsideFormElement = () => useContext(FormElementContext);

export {
  fieldContext,
  FormElementContext,
  formContext,
  useFieldContext,
  useFormContext,
  useIsInsideFormElement,
};
