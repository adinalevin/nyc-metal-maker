import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type FormType = "estimate" | "reorder" | null;

interface FormExclusionContextType {
  activeForm: FormType;
  setActiveForm: (form: FormType) => void;
  openEstimateForm: () => void;
  openReorderForm: () => void;
  closeAllForms: () => void;
}

const FormExclusionContext = createContext<FormExclusionContextType | undefined>(undefined);

export function FormExclusionProvider({ children }: { children: ReactNode }) {
  const [activeForm, setActiveFormState] = useState<FormType>(null);

  const setActiveForm = useCallback((form: FormType) => {
    setActiveFormState(form);
  }, []);

  const openEstimateForm = useCallback(() => {
    setActiveFormState("estimate");
  }, []);

  const openReorderForm = useCallback(() => {
    setActiveFormState("reorder");
  }, []);

  const closeAllForms = useCallback(() => {
    setActiveFormState(null);
  }, []);

  return (
    <FormExclusionContext.Provider
      value={{
        activeForm,
        setActiveForm,
        openEstimateForm,
        openReorderForm,
        closeAllForms,
      }}
    >
      {children}
    </FormExclusionContext.Provider>
  );
}

export function useFormExclusion() {
  const context = useContext(FormExclusionContext);
  if (context === undefined) {
    throw new Error("useFormExclusion must be used within a FormExclusionProvider");
  }
  return context;
}
