"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Package,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import {
  processReturnAssessment,
  uploadPolicyDocument,
  AssessmentResult,
} from "../actions/orchestrate";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 7 MiB raw file threshold (7 * 1024 * 1024 bytes)
const MAX_FILE_SIZE_BYTES = 7 * 1024 * 1024;
const SIZE_ERROR_MESSAGE = "File size must be 7 MiB or smaller";

// --- ZOD SCHEMAS & TYPES WITH UPPER BOUND CAPS ---

const returnFormSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order Reference ID is required")
    .max(100, "Order Reference ID must not exceed 100 characters"),
  itemCategory: z
    .string()
    .min(1, "Please select a product category")
    .max(100, "Category name must not exceed 100 characters"),
  claimReason: z
    .string()
    .min(5, "Claim reason must be at least 5 characters")
    .max(2000, "Claim reason must not exceed 2000 characters"),
  imageFile: z
    .custom<FileList>()
    .refine(
      (files) => files && files.length > 0,
      "Inspection image is required",
    )
    .refine(
      (files) =>
        files &&
        ["image/jpeg", "image/jpg", "image/png"].includes(files[0]?.type),
      "Only JPG and PNG files are supported",
    )
    .refine(
      (files) => files && files[0]?.size <= MAX_FILE_SIZE_BYTES,
      SIZE_ERROR_MESSAGE,
    ),
});

type ReturnFormValues = z.infer<typeof returnFormSchema>;

const policyFormSchema = z.object({
  brand: z
    .string()
    .min(1, "Brand name is required")
    .max(100, "Brand name must not exceed 100 characters"),
  category: z
    .string()
    .min(1, "Please select a product category")
    .max(100, "Category name must not exceed 100 characters"),
  policyFile: z
    .custom<FileList>()
    .refine((files) => files && files.length > 0, "Policy document is required")
    .refine(
      (files) =>
        files && ["application/pdf", "text/plain"].includes(files[0]?.type),
      "Only PDF and TXT files are supported",
    )
    .refine(
      (files) => files && files[0]?.size <= MAX_FILE_SIZE_BYTES,
      SIZE_ERROR_MESSAGE,
    ),
});

type PolicyFormValues = z.infer<typeof policyFormSchema>;
type FormMode = "return" | "policy";

const decisionStyles: Record<
  string,
  {
    bg: string;
    border: string;
    badge: string;
    text: string;
    icon: React.ReactNode;
  }
> = {
  APPROVE: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    text: "Approved",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
  },
  REJECT: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    badge: "bg-rose-500/20 text-rose-400 border-rose-500/40",
    text: "Rejected",
    icon: <XCircle className="w-5 h-5 text-rose-400" />,
  },
  MANUAL_REVIEW: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    text: "Manual Review Required",
    icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
  },
};

/**
 * Main dashboard component for assessing product returns and ingesting policy documents using AI.
 *
 * @returns {React.ReactElement} The rendered dashboard UI.
 */
export default function ReturnAssessorDashboard(): React.ReactElement {
  const [formMode, setFormMode] = useState<FormMode>("return");
  const [loading, setLoading] = useState(false);

  // Status feedback state
  const [returnAssessmentFail, setReturnAssessmentFail] = useState<
    string | null
  >(null);
  const [policyUploadSuccess, setPolicyUploadSuccess] = useState<string | null>(
    null,
  );
  const [policyUploadFail, setPolicyUploadFail] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // File preview states
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [policyPreviewUrl, setPolicyPreviewUrl] = useState<string | null>(null);

  // --- REACT HOOK FORM SETUP ---

  const returnForm = useForm<ReturnFormValues>({
    resolver: zodResolver(returnFormSchema),
    defaultValues: {
      orderId: "ORD-89210-X",
      itemCategory: "Consumer Electronics",
      claimReason: "Screen cracked upon arrival in package",
    },
  });

  const policyForm = useForm<PolicyFormValues>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      brand: "",
      category: "Consumer Electronics",
    },
  });

  const watchedImageFiles = returnForm.watch("imageFile");
  const watchedPolicyFiles = policyForm.watch("policyFile");

  const selectedImageFile = watchedImageFiles?.[0] || null;
  const selectedPolicyFile = watchedPolicyFiles?.[0] || null;

  /**
   * Generates a blob object URL preview for the uploaded damage inspection photo
   * and revokes it when the file changes or component unmounts.
   */
  useEffect(() => {
    if (selectedImageFile) {
      const url = URL.createObjectURL(selectedImageFile);
      setImagePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagePreviewUrl(null);
    }
  }, [selectedImageFile]);

  /**
   * Generates a blob object URL preview for the uploaded policy document
   * and revokes it when the file changes or component unmounts.
   */
  useEffect(() => {
    if (selectedPolicyFile) {
      const url = URL.createObjectURL(selectedPolicyFile);
      setPolicyPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPolicyPreviewUrl(null);
    }
  }, [selectedPolicyFile]);

  /**
   * Toggles between the Return Assessor form and the Policy Uploader form, resetting active results and form states.
   *
   * @param {FormMode} mode - The form mode to activate ('return' | 'policy').
   */
  const handleModeSwitch = (mode: FormMode): void => {
    setFormMode(mode);
    setResult(null);
    setReturnAssessmentFail(null);
    setPolicyUploadSuccess(null);
    setPolicyUploadFail(null);
    returnForm.reset();
    policyForm.reset();
  };

  /**
   * Converts a given File object into a Base64-encoded Data URL string.
   *
   * @param {File} file - The file to convert.
   * @returns {Promise<string>} A promise that resolves with the Base64 string.
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  /**
   * Handles submission of the return assessment form by encoding the damage inspection photo
   * and calling the AI orchestrator.
   *
   * @param {ReturnFormValues} data - Form data validated by returnFormSchema.
   */
  const onReturnSubmit = async (data: ReturnFormValues): Promise<void> => {
    setLoading(true);
    setReturnAssessmentFail(null);
    setResult(null);

    try {
      const file = data.imageFile[0];
      const base64Image = file ? await fileToBase64(file) : "";

      const res = await processReturnAssessment({
        orderId: data.orderId,
        userEmail: "",
        itemCategory: data.itemCategory,
        claimReason: data.claimReason,
        imageBinary: base64Image,
      });

      if (res?.status === "success") {
        const assessment = res.result as Partial<AssessmentResult> | null;
        if (
          !assessment ||
          typeof assessment.success !== "boolean" ||
          typeof assessment.decision !== "string"
        ) {
          setReturnAssessmentFail(
            `Failed to process assessment for order "${data.orderId}".`,
          );
          return;
        }
        setResult(assessment as AssessmentResult);
      } else {
        setReturnAssessmentFail(
          `Failed to process assessment for order "${data.orderId}".`,
        );
      }
    } catch (err) {
      setReturnAssessmentFail(
        `Failed to execute assessment for order "${data.orderId}". Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles submission of the policy uploader form by encoding the file to Base64
   * and storing it into vector storage.
   *
   * @param {PolicyFormValues} data - Form data validated by policyFormSchema.
   */
  const onPolicySubmit = async (data: PolicyFormValues): Promise<void> => {
    setLoading(true);
    setPolicyUploadSuccess(null);
    setPolicyUploadFail(null);

    try {
      const file = data.policyFile[0];
      const base64Policy = await fileToBase64(file);

      const res = await uploadPolicyDocument({
        documentName: file.name,
        brand: data.brand,
        category: data.category,
        content: base64Policy,
      });

      if (res?.status === "success") {
        const result = res.result as {
          success?: boolean;
          data?: string;
        } | null;
        if (
          !result ||
          typeof result.success !== "boolean" ||
          typeof result.data !== "string"
        ) {
          setPolicyUploadFail(
            `Failed to store "${file.name}" for ${data.category}.`,
          );
          return;
        }
        setPolicyUploadSuccess(
          `Policy document "${file.name}" successfully stored for ${data.category}.`,
        );
        policyForm.reset();
      } else {
        setPolicyUploadFail(
          `Failed to store "${file.name}" for ${data.category}.`,
        );
      }
    } catch (err) {
      setPolicyUploadFail(`Failed to upload policy document.`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maps a numerical fraud risk score (0 to 1) to a UI badge object containing label and color formatting.
   *
   * @param {number | null} score - The numerical fraud risk score.
   * @returns {{ color: string; label: string }} Badge formatting configuration.
   */
  const getFraudRiskBadge = (
    score: number | null,
  ): { color: string; label: string } => {
    if (score === null || score === undefined) {
      return {
        color: "text-neutral-400",
        label: "N/A",
      };
    }
    if (score > 0.5) {
      return {
        color: "text-brand-red",
        label: `${(score * 100).toFixed(0)}% (High Risk)`,
      };
    }
    if (score > 0.2) {
      return {
        color: "text-amber-400",
        label: `${(score * 100).toFixed(0)}% (Moderate Risk)`,
      };
    }
    return {
      color: "text-brand-white",
      label: `${(score * 100).toFixed(0)}% (Low Risk)`,
    };
  };

  /**
   * Validates and normalizes assessment metrics from the AI orchestrator response.
   *
   * @param {AssessmentResult | null} res - Raw assessment response from backend.
   * @returns {{ confidence: number | null; fraud: number | null; authenticity: boolean | null }} Bounded assessment values.
   */
  const normalizeMetrics = (
    res: AssessmentResult | null,
  ): {
    confidence: number | null;
    fraud: number | null;
    authenticity: boolean | null;
  } => {
    if (!res) return { confidence: null, fraud: null, authenticity: null };

    const isBoundedNumber = (val: unknown): val is number =>
      typeof val === "number" && Number.isFinite(val) && val >= 0 && val <= 1;

    const confidence = isBoundedNumber(res.confidenceScore)
      ? res.confidenceScore
      : null;

    const fraud = isBoundedNumber(res.fraudRiskScore)
      ? res.fraudRiskScore
      : null;

    const authenticity =
      typeof res.authenticityMatch === "boolean" ? res.authenticityMatch : null;

    return { confidence, fraud, authenticity };
  };

  const {
    confidence: normalizedConfidence,
    fraud: normalizedFraudScore,
    authenticity: normalizedAuthenticity,
  } = normalizeMetrics(result);

  const showRightPanel =
    (formMode === "return" && (result || selectedImageFile)) ||
    (formMode === "policy" && selectedPolicyFile);

  const activeStyle = result?.decision
    ? decisionStyles[result.decision] || decisionStyles.MANUAL_REVIEW
    : decisionStyles.MANUAL_REVIEW;

  return (
    <main className="relative min-h-screen bg-brand-black text-brand-white font-sans p-6 md:p-12">
      {/* LOADING OVERLAY */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-brand-black/80 backdrop-blur-md flex flex-col items-center justify-center transition-opacity duration-300">
          <div className="relative flex items-center justify-center">
            <div className="w-24 h-24 border-4 border-white/10 border-t-brand-red rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 flex items-center justify-center p-1 bg-brand-black rounded-lg shadow-lg border border-white/20">
                <svg
                  viewBox="0 0 200 200"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-full h-full"
                >
                  <path
                    d="M162 0H38C17.0132 0 0 17.0132 0 38V162C0 182.987 17.0132 200 38 200H162C182.987 200 200 182.987 200 162V38C200 17.0132 182.987 0 162 0Z"
                    fill="black"
                  />
                  <path d="M162 38H38V162H162V38Z" fill="white" />
                  <path
                    d="M100 64.6447L135.355 100L100 135.355L64.6447 100L100 64.6447Z"
                    className="fill-brand-red"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center space-y-2">
            <h3 className="text-lg font-bold text-brand-white tracking-wide">
              Executing AI Orchestrator
            </h3>
            <p className="text-xs font-mono text-neutral-400">
              {formMode === "return"
                ? "Running visual inspection and rule verification..."
                : "Parsing and ingesting policy document into vector store..."}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-neutral-800 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-brand-red/10 text-brand-red border border-brand-red/30 rounded-full">
                E-Commerce AI Agent
              </span>
              <span className="text-xs text-neutral-400 font-mono">v1.6.0</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-white mt-2">
              Visual Return Assessor
            </h1>
          </div>

          {/* Form Switcher */}
          <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-xl">
            <Button
              type="button"
              variant={formMode === "return" ? "default" : "ghost"}
              onClick={() => handleModeSwitch("return")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-lg transition duration-200 ${
                formMode === "return"
                  ? "bg-brand-red text-brand-white font-bold"
                  : "text-neutral-400 hover:text-brand-white"
              }`}
            >
              <Package className="w-4 h-4" /> Return Assessor
            </Button>
            <Button
              type="button"
              variant={formMode === "policy" ? "default" : "ghost"}
              onClick={() => handleModeSwitch("policy")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-mono rounded-lg transition duration-200 ${
                formMode === "policy"
                  ? "bg-brand-red text-brand-white font-bold"
                  : "text-neutral-400 hover:text-brand-white"
              }`}
            >
              <FileText className="w-4 h-4" /> Policy Uploader
            </Button>
          </div>
        </div>

        {/* Dynamic Grid Layout */}
        <div
          className={`grid grid-cols-1 ${
            showRightPanel ? "lg:grid-cols-12" : "max-w-xl mx-auto"
          } gap-8 transition-all duration-300`}
        >
          {/* Form Panel */}
          <div
            className={`${
              showRightPanel ? "lg:col-span-5" : "w-full"
            } bg-brand-black border border-neutral-800 rounded-xl p-6 space-y-5`}
          >
            {formMode === "return" ? (
              /* FORM 1: RETURN ASSESSOR */
              <>
                <h2 className="text-lg font-semibold text-brand-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand-red" /> Submit Claim
                </h2>

                <form
                  onSubmit={returnForm.handleSubmit(onReturnSubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="orderId"
                      className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1"
                    >
                      Order Reference ID
                    </label>
                    <Input
                      id="orderId"
                      type="text"
                      {...returnForm.register("orderId")}
                    />
                    {returnForm.formState.errors.orderId && (
                      <p className="text-brand-red text-xs mt-1 font-mono">
                        {returnForm.formState.errors.orderId.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="itemCategory"
                      className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1"
                    >
                      Product Category
                    </label>
                    <Controller
                      control={returnForm.control}
                      name="itemCategory"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="itemCategory">
                            <SelectValue placeholder="Select product category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Consumer Electronics">
                              Consumer Electronics
                            </SelectItem>
                            <SelectItem value="Apparel & Footwear">
                              Apparel & Footwear
                            </SelectItem>
                            <SelectItem value="Home & Kitchen">
                              Home & Kitchen
                            </SelectItem>
                            <SelectItem value="Luxury Goods">
                              Luxury Goods
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {returnForm.formState.errors.itemCategory && (
                      <p className="text-brand-red text-xs mt-1 font-mono">
                        {returnForm.formState.errors.itemCategory.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="claimReason"
                      className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1"
                    >
                      Customer Issue Description
                    </label>
                    <textarea
                      id="claimReason"
                      rows={2}
                      maxLength={2000}
                      {...returnForm.register("claimReason")}
                      className="w-full bg-brand-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-brand-white focus:outline-none focus:border-brand-red transition resize-none"
                    />
                    {returnForm.formState.errors.claimReason && (
                      <p className="text-brand-red text-xs mt-1 font-mono">
                        {returnForm.formState.errors.claimReason.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="imageFile"
                      className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1"
                    >
                      Damage Inspection Photo (JPG / PNG Only)
                    </label>
                    <Input
                      id="imageFile"
                      type="file"
                      accept="image/jpeg, image/jpg, image/png"
                      {...returnForm.register("imageFile")}
                      className="text-xs text-neutral-300 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-brand-red/20 file:text-brand-red hover:file:bg-brand-red/30 cursor-pointer"
                    />
                    {returnForm.formState.errors.imageFile && (
                      <p className="text-brand-red text-xs mt-1 font-mono">
                        {
                          returnForm.formState.errors.imageFile
                            .message as string
                        }
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2"
                  >
                    <span>Run Agent Assessment</span>
                    <ArrowRight className="w-4 h-4 ml-2 inline" />
                  </Button>

                  {returnAssessmentFail && (
                    <div className="p-3 bg-brand-red/10 border border-brand-red/40 rounded-lg text-brand-red text-xs font-mono">
                      {returnAssessmentFail}
                    </div>
                  )}
                </form>
              </>
            ) : (
              /* FORM 2: POLICY UPLOADER */
              <>
                <h2 className="text-lg font-semibold text-brand-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-brand-red" /> Upload Store
                  Policy
                </h2>
                <p className="text-xs text-neutral-400">
                  Ingest warranty policies into vector storage for automated
                  validation.
                </p>

                <form
                  onSubmit={policyForm.handleSubmit(onPolicySubmit)}
                  className="space-y-4"
                >
                  <div>
                    <label
                      htmlFor="brand"
                      className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1"
                    >
                      Brand Name
                    </label>
                    <Input
                      id="brand"
                      type="text"
                      placeholder="e.g. Sony"
                      {...policyForm.register("brand")}
                    />
                    {policyForm.formState.errors.brand && (
                      <p className="text-brand-red text-xs mt-1 font-mono">
                        {policyForm.formState.errors.brand.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="policyCategory"
                      className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1"
                    >
                      Target Product Category
                    </label>
                    <Controller
                      control={policyForm.control}
                      name="category"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="policyCategory">
                            <SelectValue placeholder="Select target category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Consumer Electronics">
                              Consumer Electronics
                            </SelectItem>
                            <SelectItem value="Apparel & Footwear">
                              Apparel & Footwear
                            </SelectItem>
                            <SelectItem value="Home & Kitchen">
                              Home & Kitchen
                            </SelectItem>
                            <SelectItem value="Luxury Goods">
                              Luxury Goods
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {policyForm.formState.errors.category && (
                      <p className="text-brand-red text-xs mt-1 font-mono">
                        {policyForm.formState.errors.category.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="policyFile"
                      className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1"
                    >
                      Policy Document (PDF / TXT Only)
                    </label>
                    <Input
                      id="policyFile"
                      type="file"
                      accept="application/pdf, text/plain"
                      {...policyForm.register("policyFile")}
                      className="text-xs text-neutral-300 file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-brand-red/20 file:text-brand-red hover:file:bg-brand-red/30 cursor-pointer"
                    />
                    {policyForm.formState.errors.policyFile && (
                      <p className="text-brand-red text-xs mt-1 font-mono">
                        {
                          policyForm.formState.errors.policyFile
                            .message as string
                        }
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2"
                  >
                    <Upload className="w-4 h-4 mr-2 inline" />
                    <span>Upload & Process Policy</span>
                  </Button>

                  {policyUploadSuccess && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-emerald-400 text-xs font-mono">
                      {policyUploadSuccess}
                    </div>
                  )}
                  {policyUploadFail && (
                    <div className="p-3 bg-brand-red/10 border border-brand-red/40 rounded-lg text-brand-red text-xs font-mono">
                      {policyUploadFail}
                    </div>
                  )}
                </form>
              </>
            )}
          </div>

          {/* Right Preview Panel & Return Matrix */}
          {showRightPanel && (
            <div className="lg:col-span-7 space-y-6">
              {formMode === "return" && selectedImageFile && (
                <div className="bg-brand-black border border-neutral-800 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                    Inspection Photo File Preview
                  </p>
                  <div className="flex items-center justify-between text-xs font-mono bg-neutral-900 p-2.5 rounded-lg border border-neutral-800">
                    <span className="truncate">{selectedImageFile.name}</span>
                    <span className="text-neutral-500">
                      {(selectedImageFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  {imagePreviewUrl && (
                    <div className="relative h-48 w-full rounded-lg overflow-hidden border border-neutral-800 bg-brand-black">
                      <img
                        src={imagePreviewUrl}
                        alt="Inspection Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {formMode === "policy" && selectedPolicyFile && (
                <div className="bg-brand-black border border-neutral-800 rounded-xl p-6 space-y-3">
                  <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                    Selected Policy Document Preview
                  </p>

                  {policyPreviewUrl ? (
                    <a
                      href={policyPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between bg-neutral-900 hover:bg-neutral-800 p-4 rounded-lg border border-neutral-800 transition duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="w-8 h-8 text-brand-red" />
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold truncate text-brand-white group-hover:text-brand-red transition">
                            {selectedPolicyFile.name}
                          </p>
                          <p className="text-xs font-mono text-neutral-500">
                            {(selectedPolicyFile.size / 1024).toFixed(1)} KB •{" "}
                            {selectedPolicyFile.type || "Document"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono text-brand-red bg-brand-red/10 px-2.5 py-1 rounded border border-brand-red/30 group-hover:bg-brand-red/20 transition">
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 bg-neutral-900 p-4 rounded-lg border border-neutral-800">
                      <FileText className="w-8 h-8 text-neutral-500" />
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate text-brand-white">
                          {selectedPolicyFile.name}
                        </p>
                        <p className="text-xs font-mono text-neutral-500">
                          {(selectedPolicyFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formMode === "return" && result && (
                <div className="bg-brand-black border border-neutral-800 rounded-xl p-6 space-y-6">
                  <div
                    className={`flex items-center justify-between rounded-xl border ${activeStyle.border} ${activeStyle.bg} p-4`}
                  >
                    <div className="flex items-center gap-3">
                      {activeStyle.icon}
                      <div>
                        <p className="text-xs uppercase tracking-wider text-neutral-400 font-mono">
                          Assessment Verdict
                        </p>
                        <h3 className="mt-0.5 text-xl font-bold">
                          {activeStyle.text}
                        </h3>
                      </div>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold font-mono ${activeStyle.badge}`}
                    >
                      {result.decision || "MANUAL_REVIEW"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-brand-black border border-neutral-800 rounded-lg p-3">
                      <p className="text-xs text-neutral-400 font-mono">
                        Confidence
                      </p>
                      <p className="text-lg font-bold text-brand-white mt-1">
                        {normalizedConfidence !== null
                          ? `${(normalizedConfidence * 100).toFixed(0)}%`
                          : "N/A"}
                      </p>
                    </div>

                    <div className="bg-brand-black border border-neutral-800 rounded-lg p-3">
                      <p className="text-xs text-neutral-400 font-mono">
                        Fraud Risk
                      </p>
                      {(() => {
                        const badge = getFraudRiskBadge(normalizedFraudScore);
                        return (
                          <p
                            className={`text-lg font-bold mt-1 ${badge.color}`}
                          >
                            {badge.label}
                          </p>
                        );
                      })()}
                    </div>

                    <div className="bg-brand-black border border-neutral-800 rounded-lg p-3">
                      <p className="text-xs text-neutral-400 font-mono">
                        Authenticity
                      </p>
                      <p
                        className={`text-lg font-bold mt-1 ${
                          normalizedAuthenticity === true
                            ? "text-emerald-400"
                            : normalizedAuthenticity === false
                              ? "text-rose-400"
                              : "text-neutral-400"
                        }`}
                      >
                        {normalizedAuthenticity === true
                          ? "Verified"
                          : normalizedAuthenticity === false
                            ? "Mismatch"
                            : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400 font-mono text-xs">
                        Detected Damage
                      </span>
                      <span className="font-semibold text-brand-white">
                        {result.damageType || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-400 font-mono text-xs">
                        Policy Citation
                      </span>
                      <span className="font-semibold text-brand-red font-mono text-xs">
                        {result.policyReference || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                      Agent Justification Log
                    </p>
                    <p className="text-sm text-neutral-300 bg-brand-black border border-neutral-800 rounded-lg p-4 leading-relaxed">
                      {result.reasoning || "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
