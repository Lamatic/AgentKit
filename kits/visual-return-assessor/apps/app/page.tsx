"use client";

import React, { useState, useEffect } from "react";
import {
  processReturnAssessment,
  uploadPolicyDocument,
  AssessmentResult,
} from "../actions/orchestrate";

type FormMode = "return" | "policy";

const decisionStyles: Record<
  string,
  { bg: string; border: string; badge: string; text: string }
> = {
  APPROVED: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    text: "Approved",
  },
  REJECTED: {
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    badge: "bg-rose-500/20 text-rose-400 border-rose-500/40",
    text: "Rejected",
  },
  MANUAL_REVIEW: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    text: "Manual Review Required",
  },
};

export default function ReturnAssessorDashboard() {
  const [formMode, setFormMode] = useState<FormMode>("return");
  const [loading, setLoading] = useState(false);

  // Policy Uploader State
  const [policyFile, setPolicyFile] = useState<File | null>(null);
  const [policyPreviewUrl, setPolicyPreviewUrl] = useState<string | null>(null);
  const [policyCategory, setPolicyCategory] = useState("Consumer Electronics");
  const [policyUploadSuccess, setPolicyUploadSuccess] = useState<string | null>(
    null,
  );
  const [policyUploadFail, setPolicyUploadFail] = useState<string | null>(null);

  // Return Assessor Form State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState("ORD-89210-X");
  const [itemCategory, setItemCategory] = useState("Consumer Electronics");
  const [claimReason, setClaimReason] = useState(
    "Screen cracked upon arrival in package",
  );
  const [result, setResult] = useState<AssessmentResult | null>(null);

  // Object URL cleanup effect
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      if (policyPreviewUrl) URL.revokeObjectURL(policyPreviewUrl);
    };
  }, [imagePreviewUrl, policyPreviewUrl]);

  // Switch form modes and reset state when switching away from policy or return
  const handleModeSwitch = (mode: FormMode) => {
    setFormMode(mode);
    setResult(null);

    // Reset Policy State & Revoke URL
    setPolicyFile(null);
    setPolicyUploadSuccess(null);
    setPolicyUploadFail(null);
    if (policyPreviewUrl) {
      URL.revokeObjectURL(policyPreviewUrl);
      setPolicyPreviewUrl(null);
    }

    // Reset Return / Image State & Revoke URL
    setImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
  };

  // Helper to convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Single Image File Handler (JPG / PNG)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setResult(null);

    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);

    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
    } else {
      setImagePreviewUrl(null);
    }
  };

  // Single Policy Document Handler (PDF / TXT)
  const handlePolicyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPolicyFile(file);
    setPolicyUploadSuccess(null);
    setPolicyUploadFail(null);

    if (policyPreviewUrl) URL.revokeObjectURL(policyPreviewUrl);

    if (file) {
      const url = URL.createObjectURL(file);
      setPolicyPreviewUrl(url);
    } else {
      setPolicyPreviewUrl(null);
    }
  };

  // Handle Policy Document Upload
  const handlePolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyFile) return;

    setLoading(true);
    setPolicyUploadSuccess(null);
    setPolicyUploadFail(null);

    try {
      const base64Policy = await fileToBase64(policyFile);
      const res = await uploadPolicyDocument({
        documentName: policyFile.name,
        brand: policyFile.name,
        category: policyCategory,
        content: base64Policy,
      });
      if (res?.statusCode === 200) {
        setPolicyUploadSuccess(
          `Policy document "${policyFile.name}" successfully stored for ${policyCategory}.`,
        );
      } else {
        setPolicyUploadFail(
          `Failed to store "${policyFile.name}" for ${policyCategory}.`,
        );
      }
      setPolicyFile(null);
      if (policyPreviewUrl) {
        URL.revokeObjectURL(policyPreviewUrl);
        setPolicyPreviewUrl(null);
      }
    } catch (err) {
      console.log("Failed to upload policy:", err);
      setPolicyUploadFail(`Failed to upload policy document.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle Return Claim Assessment (Synchronous Execution)
  const handleAssessmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const base64Image = imageFile ? await fileToBase64(imageFile) : "";

      const res = await processReturnAssessment({
        orderId,
        userEmail: "",
        itemCategory,
        claimReason,
        imageBinary: base64Image,
      });

      if (res) {
        // Hydrate result object (fallback to output object if present)
        setResult((res.result || res) as AssessmentResult);
      }
    } catch (err) {
      console.log("Failed to process assessment:", err);
    } finally {
      setLoading(false);
    }
  };

  const getFraudRiskBadge = (score: number = 0) => {
    if (score > 0.5) {
      return {
        color: "text-[#F33736]",
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
      color: "text-[#FFFFFF]",
      label: `${(score * 100).toFixed(0)}% (Low Risk)`,
    };
  };

  const showRightPanel =
    (formMode === "return" && (result || imageFile)) ||
    (formMode === "policy" && policyFile);

  const activeStyle = result?.decision
    ? decisionStyles[result.decision] || decisionStyles.MANUAL_REVIEW
    : decisionStyles.MANUAL_REVIEW;

  return (
    <main className="relative min-h-screen bg-[#000000] text-[#FFFFFF] font-sans p-6 md:p-12">
      {/* FULLSCREEN OPAQUE LOADING OVERLAY WITH LAMATIC LOGO */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-[#000000]/80 backdrop-blur-md flex flex-col items-center justify-center transition-opacity duration-300">
          <div className="relative flex items-center justify-center">
            {/* Outer Spinning Ring */}
            <div className="w-24 h-24 border-4 border-[#E3E3E3]/10 border-t-[#F33736] rounded-full animate-spin" />

            {/* Center Custom Logo Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 flex items-center justify-center p-1 bg-black rounded-lg shadow-lg border border-[#E3E3E3]/20">
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
                    fill="#F33736"
                  />
                  <path
                    d="M38 0H162C182.987 0 200 17.0132 200 38V62H162V38H38V162H62V200H38C17.0132 200 0 182.987 0 162V38C0 17.0132 17.0132 0 38 0Z"
                    fill="black"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center space-y-2">
            <h3 className="text-lg font-bold text-[#FFFFFF] tracking-wide">
              Executing Lamatic AI Orchestrator
            </h3>
            <p className="text-xs font-mono text-[#E3E3E3]/70">
              {formMode === "return"
                ? "Running visual inspection and rule verification..."
                : "Parsing and ingesting policy document into vector store..."}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#E3E3E3]/20 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-xs font-mono font-semibold bg-[#F33736]/10 text-[#F33736] border border-[#F33736]/30 rounded-full">
                E-Commerce AI Agent
              </span>
              <span className="text-xs text-[#E3E3E3]/60 font-mono">
                v1.6.0
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#FFFFFF] mt-2">
              Visual Return Assessor
            </h1>
          </div>

          {/* Form Switcher Toggle */}
          <div className="flex bg-[#E3E3E3]/10 border border-[#E3E3E3]/20 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleModeSwitch("return")}
              className={`px-4 py-2 text-xs font-mono rounded-lg transition duration-200 ${
                formMode === "return"
                  ? "bg-[#F33736] text-[#FFFFFF] font-bold"
                  : "text-[#E3E3E3]/70 hover:text-[#FFFFFF]"
              }`}
            >
              📦 Return Assessor
            </button>
            <button
              type="button"
              onClick={() => handleModeSwitch("policy")}
              className={`px-4 py-2 text-xs font-mono rounded-lg transition duration-200 ${
                formMode === "policy"
                  ? "bg-[#F33736] text-[#FFFFFF] font-bold"
                  : "text-[#E3E3E3]/70 hover:text-[#FFFFFF]"
              }`}
            >
              📄 Policy Uploader
            </button>
          </div>
        </div>

        {/* Dynamic Grid Layout */}
        <div
          className={`grid grid-cols-1 ${
            showRightPanel ? "lg:grid-cols-12" : "max-w-xl mx-auto"
          } gap-8 transition-all duration-300`}
        >
          {/* Form Container Side */}
          <div
            className={`${
              showRightPanel ? "lg:col-span-5" : "w-full"
            } bg-[#000000] border border-[#E3E3E3]/20 rounded-xl p-6 space-y-5`}
          >
            {formMode === "return" ? (
              /* FORM 1: RETURN ASSESSOR (DEFAULT) */
              <>
                <h2 className="text-lg font-semibold text-[#FFFFFF] flex items-center gap-2">
                  <span>📦</span> Submit Claim
                </h2>

                <form onSubmit={handleAssessmentSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-[#E3E3E3]/70 uppercase tracking-wider mb-1">
                      Order Reference ID
                    </label>
                    <input
                      type="text"
                      value={orderId}
                      onChange={(e) => setOrderId(e.target.value)}
                      className="w-full bg-[#000000] border border-[#E3E3E3]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#F33736] transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#E3E3E3]/70 uppercase tracking-wider mb-1">
                      Product Category
                    </label>
                    <select
                      value={itemCategory}
                      onChange={(e) => setItemCategory(e.target.value)}
                      className="w-full bg-[#000000] border border-[#E3E3E3]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#F33736] transition"
                    >
                      <option className="bg-[#000000]">
                        Consumer Electronics
                      </option>
                      <option className="bg-[#000000]">
                        Apparel & Footwear
                      </option>
                      <option className="bg-[#000000]">Home & Kitchen</option>
                      <option className="bg-[#000000]">Luxury Goods</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#E3E3E3]/70 uppercase tracking-wider mb-1">
                      Customer Issue Description
                    </label>
                    <textarea
                      rows={2}
                      value={claimReason}
                      onChange={(e) => setClaimReason(e.target.value)}
                      className="w-full bg-[#000000] border border-[#E3E3E3]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#F33736] transition resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#E3E3E3]/70 uppercase tracking-wider mb-1">
                      Damage Inspection Photo (JPG / PNG Only)
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg, image/jpg, image/png"
                      onChange={handleImageFileChange}
                      className="w-full bg-[#000000] border border-[#E3E3E3]/30 rounded-lg px-3 py-2 text-xs text-[#E3E3E3] file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#F33736]/20 file:text-[#F33736] hover:file:bg-[#F33736]/30 cursor-pointer"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !imageFile}
                    className="w-full bg-[#F33736] hover:bg-[#F33736]/90 text-[#FFFFFF] font-semibold py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 border border-[#F33736] mt-2"
                  >
                    <span>Run Agent Assessment →</span>
                  </button>
                </form>
              </>
            ) : (
              /* FORM 2: POLICY UPLOADER */
              <>
                <h2 className="text-lg font-semibold text-[#FFFFFF] flex items-center gap-2">
                  <span>📄</span> Upload Store Policy Document
                </h2>
                <p className="text-xs text-[#E3E3E3]/70">
                  Ingest warranty policies into vector storage for automated
                  validation.
                </p>

                <form onSubmit={handlePolicySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-[#E3E3E3]/70 uppercase tracking-wider mb-1">
                      Target Product Category
                    </label>
                    <select
                      value={policyCategory}
                      onChange={(e) => setPolicyCategory(e.target.value)}
                      className="w-full bg-[#000000] border border-[#E3E3E3]/30 rounded-lg px-3 py-2 text-sm text-[#FFFFFF] focus:outline-none focus:border-[#F33736] transition"
                    >
                      <option className="bg-[#000000]">
                        Consumer Electronics
                      </option>
                      <option className="bg-[#000000]">
                        Apparel & Footwear
                      </option>
                      <option className="bg-[#000000]">Home & Kitchen</option>
                      <option className="bg-[#000000]">Luxury Goods</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#E3E3E3]/70 uppercase tracking-wider mb-1">
                      Policy Document (PDF / TXT Only)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf, text/plain"
                      onChange={handlePolicyFileChange}
                      className="w-full bg-[#000000] border border-[#E3E3E3]/30 rounded-lg px-3 py-2 text-xs text-[#E3E3E3] file:mr-3 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[#F33736]/20 file:text-[#F33736] hover:file:bg-[#F33736]/30 cursor-pointer"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !policyFile}
                    className="w-full bg-[#F33736] hover:bg-[#F33736]/90 text-[#FFFFFF] font-semibold py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 border border-[#F33736] mt-2"
                  >
                    <span>Upload & Process Policy →</span>
                  </button>

                  {policyUploadSuccess && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-emerald-400 text-xs font-mono">
                      {policyUploadSuccess}
                    </div>
                  )}
                  {policyUploadFail && (
                    <div className="p-3 bg-emerald-950/40 border border-red-500/90 rounded-lg text-red-400 text-xs font-mono">
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
              {/* File Preview Card - Return Assessor Mode */}
              {formMode === "return" && imageFile && (
                <div className="bg-[#000000] border border-[#E3E3E3]/20 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-mono text-[#E3E3E3]/70 uppercase tracking-wider">
                    Inspection Photo File Preview
                  </p>
                  <div className="flex items-center justify-between text-xs font-mono bg-[#E3E3E3]/10 p-2.5 rounded-lg border border-[#E3E3E3]/20">
                    <span className="truncate">{imageFile.name}</span>
                    <span className="text-[#E3E3E3]/60">
                      {(imageFile.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  {imagePreviewUrl && (
                    <div className="relative h-48 w-full rounded-lg overflow-hidden border border-[#E3E3E3]/20 bg-[#000000]">
                      <img
                        src={imagePreviewUrl}
                        alt="Inspection Preview"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* File Preview Card - Policy Uploader Mode (Clickable PDF preview in new tab) */}
              {formMode === "policy" && policyFile && (
                <div className="bg-[#000000] border border-[#E3E3E3]/20 rounded-xl p-6 space-y-3">
                  <p className="text-xs font-mono text-[#E3E3E3]/70 uppercase tracking-wider">
                    Selected Policy Document Preview
                  </p>

                  {policyPreviewUrl ? (
                    <a
                      href={policyPreviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between bg-[#E3E3E3]/10 hover:bg-[#E3E3E3]/20 p-4 rounded-lg border border-[#E3E3E3]/20 transition duration-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-2xl">📄</span>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold truncate text-[#FFFFFF] group-hover:text-[#F33736] transition">
                            {policyFile.name}
                          </p>
                          <p className="text-xs font-mono text-[#E3E3E3]/60">
                            {(policyFile.size / 1024).toFixed(1)} KB •{" "}
                            {policyFile.type || "Document"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-mono text-[#F33736] bg-[#F33736]/10 px-2.5 py-1 rounded border border-[#F33736]/30 group-hover:bg-[#F33736]/20 transition">
                        <span>Open & Read</span>
                        <span>↗</span>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 bg-[#E3E3E3]/10 p-4 rounded-lg border border-[#E3E3E3]/20">
                      <span className="text-2xl">📄</span>
                      <div className="overflow-hidden">
                        <p className="text-sm font-semibold truncate text-[#FFFFFF]">
                          {policyFile.name}
                        </p>
                        <p className="text-xs font-mono text-[#E3E3E3]/60">
                          {(policyFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* RETURN MATRIX - ONLY VISIBLE WHEN RESULTS ARE RETURNED IN RETURN ASSESSOR MODE */}
              {formMode === "return" && result && (
                <div className="bg-[#000000] border border-[#E3E3E3]/20 rounded-xl p-6 space-y-6">
                  {/* Verdict Banner Header */}
                  <div
                    className={`flex items-center justify-between rounded-xl border ${activeStyle.border} ${activeStyle.bg} p-4`}
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#E3E3E3]/70 font-mono">
                        Assessment Verdict
                      </p>
                      <h3 className="mt-1 text-xl font-bold">
                        {activeStyle.text}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold font-mono ${activeStyle.badge}`}
                    >
                      {result.decision || "MANUAL_REVIEW"}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-[#000000] border border-[#E3E3E3]/30 rounded-lg p-3">
                      <p className="text-xs text-[#E3E3E3]/70 font-mono">
                        Confidence
                      </p>
                      <p className="text-lg font-bold text-[#FFFFFF] mt-1">
                        {((result.confidenceScore ?? 0.95) * 100).toFixed(0)}%
                      </p>
                    </div>

                    <div className="bg-[#000000] border border-[#E3E3E3]/30 rounded-lg p-3">
                      <p className="text-xs text-[#E3E3E3]/70 font-mono">
                        Fraud Risk
                      </p>
                      {(() => {
                        const score =
                          typeof result.fraudRiskScore === "number"
                            ? result.fraudRiskScore
                            : 0.1;
                        const badge = getFraudRiskBadge(score);
                        return (
                          <p
                            className={`text-lg font-bold mt-1 ${badge.color}`}
                          >
                            {badge.label}
                          </p>
                        );
                      })()}
                    </div>

                    <div className="bg-[#000000] border border-[#E3E3E3]/30 rounded-lg p-3">
                      <p className="text-xs text-[#E3E3E3]/70 font-mono">
                        Authenticity
                      </p>
                      <p className="text-lg font-bold text-emerald-400 mt-1">
                        {(result.authenticityMatch ?? true)
                          ? "Verified"
                          : "Mismatch"}
                      </p>
                    </div>
                  </div>

                  {/* Damage & Policy Reference Detail */}
                  <div className="space-y-3 rounded-xl border border-[#E3E3E3]/20 bg-[#E3E3E3]/5 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#E3E3E3]/70 font-mono text-xs">
                        Detected Damage
                      </span>
                      <span className="font-semibold text-[#FFFFFF]">
                        {result.damageType || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#E3E3E3]/70 font-mono text-xs">
                        Policy Citation
                      </span>
                      <span className="font-semibold text-[#F33736] font-mono text-xs">
                        {result.policyReference || "Standard Policy Check"}
                      </span>
                    </div>
                  </div>

                  {/* Reasoning Log */}
                  <div className="space-y-2">
                    <p className="text-xs font-mono text-[#E3E3E3]/70 uppercase tracking-wider">
                      Agent Justification Log
                    </p>
                    <p className="text-sm text-[#E3E3E3] bg-[#000000] border border-[#E3E3E3]/30 rounded-lg p-4 leading-relaxed">
                      {result.reasoning}
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
