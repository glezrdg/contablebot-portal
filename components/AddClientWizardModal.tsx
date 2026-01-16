/**
 * AddClientWizardModal Component (TEST VERSION)
 *
 * Multi-step wizard modal for adding a new client.
 * This is a PROOF OF CONCEPT with dummy data for UX validation.
 *
 * Steps:
 * 1. Identificación del contribuyente
 * 2. Información de contacto
 * 3. Información fiscal (DGII)
 * 4. Información bancaria (Step 5 in spec)
 *
 * REQUIRED fields (validation enforced):
 * - Tipo de contribuyente
 * - Nombre completo / Razón social
 * - Cédula / RNC
 * - Nombre comercial
 *
 * All other fields are OPTIONAL.
 */

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Client } from "@/types";

interface AddClientWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (client: Client) => void;
}

interface FormData {
  // Step 1 - Identificación (REQUIRED fields)
  tipoContribuyente: "fisica" | "juridica" | "";
  nombreCompleto: string;
  cedulaRnc: string;
  nombreComercial: string;
  // Step 1 - Optional fields
  actividadEconomica: string;
  fechaInicioOperaciones: string;

  // Step 2 - Información de contacto (ALL OPTIONAL)
  direccionFiscal: string;
  provincia: string;
  municipio: string;
  telefono: string;
  correoElectronico: string;

  // Step 3 - Información fiscal (ALL OPTIONAL)
  rnc: string;
  tiposNcf: string[];
  inscritoDgii: boolean | null;
  facturaElectronica: boolean | null;

  // Step 4 (labeled as Step 5) - Información bancaria (ALL OPTIONAL)
  banco: string;
  tipoCuenta: "ahorro" | "corriente" | "";
  numeroCuenta: string;
  usoCuenta: string;
}

const INITIAL_FORM_DATA: FormData = {
  tipoContribuyente: "",
  nombreCompleto: "",
  cedulaRnc: "",
  nombreComercial: "",
  actividadEconomica: "",
  fechaInicioOperaciones: "",
  direccionFiscal: "",
  provincia: "",
  municipio: "",
  telefono: "",
  correoElectronico: "",
  rnc: "",
  tiposNcf: [],
  inscritoDgii: null,
  facturaElectronica: null,
  banco: "",
  tipoCuenta: "",
  numeroCuenta: "",
  usoCuenta: "",
};

export default function AddClientWizardModal({
  isOpen,
  onClose,
  onClientAdded,
}: AddClientWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const totalSteps = 4;

  // Handle form field changes
  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Toggle NCF types (multi-select)
  const toggleNcfType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      tiposNcf: prev.tiposNcf.includes(type)
        ? prev.tiposNcf.filter((t) => t !== type)
        : [...prev.tiposNcf, type],
    }));
  };

  // Validate REQUIRED fields for Step 1
  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.tipoContribuyente) {
      newErrors.tipoContribuyente = "Este campo es requerido";
    }
    if (!formData.nombreCompleto.trim()) {
      newErrors.nombreCompleto = "Este campo es requerido";
    }
    if (!formData.cedulaRnc.trim()) {
      newErrors.cedulaRnc = "Este campo es requerido";
    }
    if (!formData.nombreComercial.trim()) {
      newErrors.nombreComercial = "Este campo es requerido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // No validation for steps 2, 3, 4 (all optional)
  const validateCurrentStep = (): boolean => {
    if (currentStep === 1) {
      return validateStep1();
    }
    // Steps 2, 3, 4 have no required fields
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Final validation before submit
    if (!validateStep1()) {
      setCurrentStep(1); // Go back to step 1 if required fields missing
      return;
    }

    console.log("[TEST WIZARD] Form submitted with data:", formData);

    // Create a dummy client object for testing
    const dummyClient: Client = {
      id: Date.now(), // Temporary ID
      firm_id: 1, // Dummy firm ID
      rnc: formData.cedulaRnc, // Use the cedulaRnc as compact RNC
      name: formData.nombreComercial, // Use commercial name
    };

    // Call the callback with the dummy client
    onClientAdded(dummyClient);

    alert("Cliente agregado exitosamente (TEST WIZARD)");
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md z-[51]"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-[0_24px_64px_0_rgba(0,0,0,0.3)]">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[var(--glass-border)] bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shadow-md">
                <UserPlus className="w-5 h-5 text-primary drop-shadow-sm" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  Agregar nuevo cliente
                </h2>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                  Paso {currentStep} de {totalSteps}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="group text-muted-foreground hover:text-foreground transition-all p-2 hover:bg-[var(--glass-white)] rounded-xl border border-transparent hover:border-[var(--glass-border)] shadow-sm"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 pt-6">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex-1">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      step <= currentStep
                        ? "bg-primary"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {/* Step 1 - Identificación */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Identificación del contribuyente
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Los campos marcados con <span className="text-destructive">*</span> son obligatorios.
                  </p>
                </div>

                {/* Tipo de contribuyente - REQUIRED */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                    Tipo de contribuyente <span className="text-destructive ml-1">*</span>
                  </label>
                  <select
                    value={formData.tipoContribuyente}
                    onChange={(e) => handleChange("tipoContribuyente", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.tipoContribuyente ? "border-destructive" : "border-border"
                    }`}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="fisica">Persona Física</option>
                    <option value="juridica">Persona Jurídica</option>
                  </select>
                  {errors.tipoContribuyente && (
                    <p className="text-xs text-destructive mt-2 ml-1">{errors.tipoContribuyente}</p>
                  )}
                </div>

                {/* Nombre completo / Razón social - REQUIRED */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                    {formData.tipoContribuyente === "juridica" ? "Razón social" : "Nombre completo"} <span className="text-destructive ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombreCompleto}
                    onChange={(e) => handleChange("nombreCompleto", e.target.value)}
                    placeholder={formData.tipoContribuyente === "juridica" ? "Ej: Empresa XYZ, S.A." : "Ej: Juan Pérez"}
                    className={`w-full px-4 py-3 rounded-xl border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.nombreCompleto ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors.nombreCompleto && (
                    <p className="text-xs text-destructive mt-2 ml-1">{errors.nombreCompleto}</p>
                  )}
                </div>

                {/* Cédula / RNC - REQUIRED */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                    {formData.tipoContribuyente === "juridica" ? "RNC" : "Cédula / RNC"} <span className="text-destructive ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.cedulaRnc}
                    onChange={(e) => handleChange("cedulaRnc", e.target.value)}
                    placeholder="Ej: 1-30-12345-4"
                    className={`w-full px-4 py-3 rounded-xl border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.cedulaRnc ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors.cedulaRnc && (
                    <p className="text-xs text-destructive mt-2 ml-1">{errors.cedulaRnc}</p>
                  )}
                </div>

                {/* Nombre comercial - REQUIRED */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                    Nombre comercial <span className="text-destructive ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombreComercial}
                    onChange={(e) => handleChange("nombreComercial", e.target.value)}
                    placeholder="Ej: Tienda El Sol"
                    className={`w-full px-4 py-3 rounded-xl border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary ${
                      errors.nombreComercial ? "border-destructive" : "border-border"
                    }`}
                  />
                  {errors.nombreComercial && (
                    <p className="text-xs text-destructive mt-2 ml-1">{errors.nombreComercial}</p>
                  )}
                </div>

                {/* Actividad económica - OPTIONAL */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    Actividad económica <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.actividadEconomica}
                    onChange={(e) => handleChange("actividadEconomica", e.target.value)}
                    placeholder="Ej: Comercio al por menor"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Fecha de inicio - OPTIONAL */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    Fecha de inicio de operaciones <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.fechaInicioOperaciones}
                    onChange={(e) => handleChange("fechaInicioOperaciones", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Step 2 - Información de contacto (ALL OPTIONAL) */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Información de contacto
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Todos los campos de esta sección son opcionales.
                  </p>
                </div>

                {/* Dirección fiscal */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    Dirección fiscal <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <textarea
                    value={formData.direccionFiscal}
                    onChange={(e) => handleChange("direccionFiscal", e.target.value)}
                    placeholder="Ej: Calle Principal #123, Sector Los Prados"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Provincia */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                      <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                      Provincia <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.provincia}
                      onChange={(e) => handleChange("provincia", e.target.value)}
                      placeholder="Ej: Santo Domingo"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Municipio */}
                  <div>
                    <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                      <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                      Municipio <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.municipio}
                      onChange={(e) => handleChange("municipio", e.target.value)}
                      placeholder="Ej: Distrito Nacional"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    Teléfono <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleChange("telefono", e.target.value)}
                    placeholder="Ej: (809) 555-1234"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Correo electrónico */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    Correo electrónico <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <input
                    type="email"
                    value={formData.correoElectronico}
                    onChange={(e) => handleChange("correoElectronico", e.target.value)}
                    placeholder="Ej: contacto@empresa.com"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Step 3 - Información fiscal (ALL OPTIONAL) */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Información fiscal (DGII)
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Todos los campos de esta sección son opcionales.
                  </p>
                </div>

                {/* RNC (repetido para información fiscal) */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    RNC <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rnc}
                    onChange={(e) => handleChange("rnc", e.target.value)}
                    placeholder="Ej: 1-30-12345-4"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Tipo de NCF - Multi-select */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    Tipo de NCF que emite <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "B01", label: "B01 – Crédito Fiscal" },
                      { value: "B02", label: "B02 – Consumidor Final" },
                      { value: "B14", label: "B14 – Régimen Especial" },
                      { value: "B15", label: "B15 – Gubernamental" },
                    ].map((ncf) => (
                      <label
                        key={ncf.value}
                        className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={formData.tiposNcf.includes(ncf.value)}
                          onChange={() => toggleNcfType(ncf.value)}
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-foreground">{ncf.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* ¿Inscrito en la DGII? */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    ¿Está inscrito en la DGII? <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange("inscritoDgii", true)}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        formData.inscritoDgii === true
                          ? "bg-primary text-white shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange("inscritoDgii", false)}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        formData.inscritoDgii === false
                          ? "bg-primary text-white shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* ¿Usa facturación electrónica? */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    ¿Usa facturación electrónica (e-CF)? <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange("facturaElectronica", true)}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        formData.facturaElectronica === true
                          ? "bg-primary text-white shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      Sí
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange("facturaElectronica", false)}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        formData.facturaElectronica === false
                          ? "bg-primary text-white shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 (labeled as Step 5) - Información bancaria (ALL OPTIONAL) */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Información bancaria
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Todos los campos de esta sección son opcionales.
                  </p>
                </div>

                {/* Banco */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    Banco <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.banco}
                    onChange={(e) => handleChange("banco", e.target.value)}
                    placeholder="Ej: Banco Popular"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Tipo de cuenta */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    Tipo de cuenta <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleChange("tipoCuenta", "ahorro")}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        formData.tipoCuenta === "ahorro"
                          ? "bg-primary text-white shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      Ahorro
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange("tipoCuenta", "corriente")}
                      className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                        formData.tipoCuenta === "corriente"
                          ? "bg-primary text-white shadow-md"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                      }`}
                    >
                      Corriente
                    </button>
                  </div>
                </div>

                {/* Número de cuenta */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    Número de cuenta <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.numeroCuenta}
                    onChange={(e) => handleChange("numeroCuenta", e.target.value)}
                    placeholder="Ej: ****-****-****-1234"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                {/* Uso de la cuenta */}
                <div>
                  <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                    <div className="w-1 h-4 bg-gray-400 rounded-full"></div>
                    Uso de la cuenta <span className="text-xs text-muted-foreground ml-1 normal-case">(Opcional)</span>
                  </label>
                  <select
                    value={formData.usoCuenta}
                    onChange={(e) => handleChange("usoCuenta", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="operativa">Operativa</option>
                    <option value="impuestos">Pago de impuestos</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row gap-3 p-6 sm:p-8 pt-0">
            {/* Back Button */}
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                className="flex-1 rounded-xl py-3 font-bold"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>
            )}

            {/* Next / Submit Button */}
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
                className="flex-1 rounded-xl py-3 font-bold bg-gradient-to-r from-primary to-[hsl(221_83%_63%)] hover:from-primary/90 hover:to-[hsl(221_83%_63%)]/90 shadow-md hover:shadow-lg transition-all"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                className="flex-1 rounded-xl py-3 font-bold bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-md hover:shadow-lg transition-all"
              >
                <Check className="w-4 h-4 mr-2" />
                Finalizar y crear cliente
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
