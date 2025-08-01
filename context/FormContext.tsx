import React, { createContext, useContext, useState } from "react"

export interface DiamondData {
  // હીરાની વિગતો (Diamond Details)
  Roughname: string
  carat: string
  price: string
  color: string
  Size: string
  Quality: string
  whiteness: string
  veparicontact: string
  vepariname: string
  dalalname: string
  dalalcontact: string

  // પ્રમાણપત્ર (Certification)
  office_name: string
  weight: string
  Size_office: string
  nung_count : string
  sendingdate : Date | undefined

  // કિંમત અને મૂલ્યાંકન (Pricing & Valuation)
  office_name_final : string
  Roughnamefinal : string
  submitdate: Date | undefined
  topi : number, 
  patti : number, 
  simcard : number,
  totalweight : number,
  finalsize : string
}

interface ValidationErrors {
  [key: string]: string
}

interface UserData {
  email: string
  isAdmin: boolean
  name: string
}



export type FormErrors = Partial<Record<keyof DiamondData, string>>

interface FormContextType {
  formData: DiamondData
  setFormData: React.Dispatch<React.SetStateAction<DiamondData>>
  updateFormData: (key: keyof DiamondData, value: any) => void
  errors: FormErrors
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>
  touchedFields: Set<keyof DiamondData>
  setTouchedFields: React.Dispatch<React.SetStateAction<Set<keyof DiamondData>>>
  renderError: (field: keyof DiamondData) => React.ReactNode
  markTabComplete: (tabName: string) => void
}

const FormContext = createContext<FormContextType | undefined>(undefined)

export const useFormContext = () => {
  const context = useContext(FormContext)
  if (!context) throw new Error("useFormContext must be used within a FormProvider")
  return context
}

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
   const [formData, setFormData] = useState<DiamondData>({
  // હીરાની વિગતો
  Roughname: "",
  carat: "",
  price: "",
  color: "",
  Size: "",
  Quality: "",
  whiteness: "",
  veparicontact: "",
  vepariname: "",
  dalalname: "",
  dalalcontact: "",

  // office processing / certification
  office_name: "",
  weight: "",  // ✅ Provide default number
  Size_office: "",
  nung_count: "",  // ✅ Provide default string
  sendingdate: undefined,

  // કિંમત અને મૂલ્યાંકન
  office_name_final : "",
  submitdate : undefined,
  topi : 0, 
  patti : 0, 
  simcard : 0,
  totalweight : 0,
  Roughnamefinal : "",
  finalsize : ""
})


  const [errors, setErrors] = useState<FormErrors>({})
  const [touchedFields, setTouchedFields] = useState<Set<keyof DiamondData>>(new Set())

  const updateFormData = (key: keyof DiamondData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

const resetFormData = () => {
  setFormData({
    // હીરાની વિગતો
    Roughname: "",
    carat: "",
    price: "",
    color: "",
    Size: "",
    Quality: "",
    whiteness: "",
    veparicontact: "",
    vepariname: "",
    dalalname: "",
    dalalcontact: "",

    // office processing / certification
    office_name: "",
    weight: "",
    Size_office: "",
    nung_count: "",
    sendingdate: undefined,

    // કિંમત અને મૂલ્યાંકન
    office_name_final: "",
    Roughnamefinal: "",
    submitdate: undefined,
    topi: 0,
    patti: 0,
    simcard: 0,
    totalweight: 0,
    finalsize: ""
  });
};

  const renderError = (field: keyof DiamondData) => {
    if (!touchedFields.has(field) || !errors[field]) return null
    return <p className="text-sm text-red-500">{errors[field]}</p>
  }
   const markTabComplete = (tabName: string) => {
    console.log(`Tab "${tabName}" marked as complete.`)
  }

  return (
    <FormContext.Provider
      value={{
        formData,
        setFormData,
        updateFormData,
        errors,
        setErrors,
        touchedFields,
        setTouchedFields,
        renderError,
        markTabComplete,
      }}
    >
      {children}
    </FormContext.Provider>
  )
}
