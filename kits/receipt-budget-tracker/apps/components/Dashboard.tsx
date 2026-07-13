"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  UploadCloud, 
  Trash2, 
  Loader2, 
  Receipt, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Info,
  Sparkles,
  History as HistoryIcon
} from "lucide-react";
import { orchestrateReceipt, ReceiptAnalysisResult } from "@/actions/orchestrate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ReceiptItem extends ReceiptAnalysisResult {
  id: string;
  uploadedAt: string;
}

export default function Dashboard() {
  const [history, setHistory] = useState<ReceiptItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReceiptItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatedWarning, setSimulatedWarning] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from LocalStorage on mount
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const saved = localStorage.getItem("receipt_history");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as ReceiptItem[];
        setHistory(parsed);
        if (parsed.length > 0) {
          setSelectedItem(parsed[0]);
        }
      } catch (err) {
        console.error("Failed to parse receipt history from local storage:", err);
      }
    }
    setIsLoaded(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Sync history to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("receipt_history", JSON.stringify(history));
    }
  }, [history, isLoaded]);

  // Calculate statistics
  const budgetLimit = 500.0;
  const totalSpent = history.reduce((sum, item) => sum + item.total, 0);
  const budgetPercentage = Math.min((totalSpent / budgetLimit) * 100, 100);
  const isBudgetExceeded = totalSpent > budgetLimit;
  const remainingBudget = Math.max(budgetLimit - totalSpent, 0);

  // Handle file uploads
  const processFile = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSimulatedWarning(false);

    // Validate file size is less than 5MB
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size allowed is 5MB.");
      setIsUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await orchestrateReceipt(formData);

      if (response.success && response.data) {
        const newItem: ReceiptItem = {
          ...response.data,
          id: crypto.randomUUID(),
          uploadedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setHistory((prevHistory) => {
          const updated = [newItem, ...prevHistory];
          setSelectedItem(newItem);
          return updated;
        });

        if (response.simulated) {
          setSimulatedWarning(true);
        }
      } else {
        setError(response.error || "An error occurred during receipt processing.");
      }
    } catch (err: unknown) {
      const errorObject = err as Error;
      setError(errorObject.message || "Failed to upload receipt. Make sure the server action is configured correctly.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Handle item deletion
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the item
    setHistory((prevHistory) => {
      const updated = prevHistory.filter(item => item.id !== id);
      setSelectedItem((prevSelected) => {
        if (prevSelected?.id === id) {
          return updated.length > 0 ? updated[0] : null;
        }
        return prevSelected;
      });
      return updated;
    });
  };

  // Trigger quick simulation flow for testing with predefined mock names
  const handleDemoTrigger = async (type: string) => {
    const virtualFile = new File(["dummy content"], `${type}_receipt.jpg`, { type: "image/jpeg" });
    processFile(virtualFile);
  };

  // Helper for progress bar color
  const getProgressColor = () => {
    if (budgetPercentage >= 100) return "bg-rose-500 shadow-rose-500/50";
    if (budgetPercentage >= 75) return "bg-amber-500 shadow-amber-500/50";
    return "bg-emerald-500 shadow-emerald-500/50";
  };

  const getProgressTextClass = () => {
    if (budgetPercentage >= 100) return "text-rose-400";
    if (budgetPercentage >= 75) return "text-amber-400";
    return "text-emerald-400";
  };

  // Helper for category colors
  const getCategoryBadgeClass = (category: string) => {
    const cat = category.toLowerCase();
    switch (cat) {
      case "food":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "travel":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "utilities":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "groceries":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "entertainment":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Navigation / Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Lamatic.ai AgentKit Flow
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Receipt Budget Tracker
          </h1>
          <p className="mt-1.5 text-sm text-slate-400 max-w-xl">
            Scan and organize receipt images automatically using the Lamatic Server SDK. Keep your monthly budget under check.
          </p>
        </div>

        {/* Demo Fast Triggers */}
        <div className="flex flex-col gap-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Info className="h-3 w-3 text-indigo-400" />
            No API Keys? Run Simulated Demo Receipts:
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              id="btn-demo-starbucks"
              variant="outline"
              size="sm"
              onClick={() => handleDemoTrigger("starbucks")}
            >
              ☕ Starbucks
            </Button>
            <Button
              id="btn-demo-walmart"
              variant="outline"
              size="sm"
              onClick={() => handleDemoTrigger("walmart")}
            >
              🛒 Walmart
            </Button>
            <Button
              id="btn-demo-uber"
              variant="outline"
              size="sm"
              onClick={() => handleDemoTrigger("uber")}
            >
              🚗 Uber Ride
            </Button>
            <Button
              id="btn-demo-utility"
              variant="outline"
              size="sm"
              onClick={() => handleDemoTrigger("utility")}
            >
              ⚡ City Power
            </Button>
          </div>
        </div>
      </header>

      {/* Warnings & Errors */}
      {simulatedWarning && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm flex items-start gap-3 shadow-lg">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Running in Simulation Mode:</span> Your `.env` credentials are using placeholder values. We processed this receipt locally using simulated OCR and schema extraction. To process actual API requests, configure the correct variables in your `.env` file.
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-start gap-3 shadow-lg">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="w-full">
            <span className="font-semibold text-white">Flow Execution Error:</span> {error}
            <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900/30 font-mono">
              Tips: Double-check your `LAMATIC_API_KEY` and project connectivity in `.env`.
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Spent Card */}
        <Card className="flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Spent</p>
            <h3 className={`text-3xl font-extrabold mt-1 tracking-tight ${isBudgetExceeded ? 'text-rose-400' : 'text-white'}`}>
              ${totalSpent.toFixed(2)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-slate-500" />
              {history.length} receipt{history.length !== 1 ? 's' : ''} uploaded
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isBudgetExceeded ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
            <DollarSign className="h-7 w-7" />
          </div>
        </Card>

        {/* Budget limit Card */}
        <Card className="flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Budget Goal limit</p>
            <h3 className="text-3xl font-extrabold mt-1 tracking-tight text-white">
              ${budgetLimit.toFixed(2)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Monthly spending target limit
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800 text-slate-400">
            <Wallet className="h-7 w-7" />
          </div>
        </Card>

        {/* Remaining Budget Card */}
        <Card className="flex items-center justify-between p-6">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Remaining Budget</p>
            <h3 className={`text-3xl font-extrabold mt-1 tracking-tight ${getProgressTextClass()}`}>
              ${remainingBudget.toFixed(2)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isBudgetExceeded ? 'Over limit!' : 'Under budget limit'}
            </p>
          </div>
          <div className={`p-4 rounded-xl ${isBudgetExceeded ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
            {isBudgetExceeded ? (
              <AlertTriangle className="h-7 w-7" />
            ) : (
              <CheckCircle className="h-7 w-7" />
            )}
          </div>
        </Card>
      </section>

      {/* Progress Bar Widget */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-200">Budget Progress Tracker</span>
          <span className={`text-sm font-bold ${getProgressTextClass()}`}>
            {budgetPercentage.toFixed(1)}% of $500.00 Limit
          </span>
        </div>
        <Progress value={budgetPercentage} indicatorClassName={getProgressColor()} />
      </Card>

      {/* Main Grid: Upload & History (Left) | Details breakdown (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Upload + List) - 7 cols */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Upload Zone */}
          <div 
            id="btn-upload-zone"
            role="button"
            tabIndex={isUploading ? -1 : 0}
            onClick={isUploading ? undefined : triggerFileSelect}
            onKeyDown={(e) => {
              if (isUploading) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                triggerFileSelect();
              }
            }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 backdrop-blur-sm flex flex-col items-center justify-center min-h-[220px] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              isDragActive 
                ? "border-indigo-400 bg-indigo-500/10 shadow-lg shadow-indigo-500/5" 
                : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/20 bg-slate-900/10"
            }`}
          >
            <input 
              ref={fileInputRef}
              id="file-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="flex flex-col items-center py-4">
                <Loader2 className="h-10 w-10 text-indigo-400 animate-spin mb-4" />
                <h4 className="text-base font-semibold text-white">Analyzing Receipt image...</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
                  Lamatic Flow is running OCR & extracting vendor metadata
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center py-2">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 mb-4 transition-transform group-hover:scale-105">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h4 className="text-base font-semibold text-white">Drag & drop your receipt here</h4>
                <p className="text-xs text-slate-400 mt-1.5">
                  or <span className="text-indigo-400 font-semibold hover:underline">browse files</span> from your device
                </p>
                <p className="text-[10px] text-slate-500 mt-4 uppercase font-bold tracking-widest">
                  PNG, JPG, JPEG up to 5MB
                </p>
              </div>
            )}
          </div>

          {/* Historical list */}
          <Card className="overflow-hidden shadow-xl flex-1 flex flex-col min-h-[300px]">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <HistoryIcon className="h-5 w-5 text-indigo-400" />
                Receipt Upload History
              </h3>
              <Badge variant="secondary">
                {history.length} Saved
              </Badge>
            </div>

            {history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500">
                <FileSpreadsheet className="h-12 w-12 text-slate-700 mb-3" />
                <p className="text-sm font-medium">No receipts analyzed yet</p>
                <p className="text-xs text-slate-600 mt-1 max-w-[250px] text-center">
                  Upload a receipt image or trigger one of the demo buttons above to view statistics.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 overflow-y-auto max-h-[420px] flex-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`flex items-center justify-between p-4 cursor-pointer transition-all duration-150 hover:bg-slate-800/30 ${
                      selectedItem?.id === item.id 
                        ? "bg-indigo-500/5 border-l-4 border-indigo-500" 
                        : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400 shrink-0">
                        <Receipt className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.vendor}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Badge className={getCategoryBadgeClass(item.category)}>
                            {item.category}
                          </Badge>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {item.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 shrink-0">
                      <span className="text-sm font-extrabold text-white">
                        ${item.total.toFixed(2)}
                      </span>
                      <Button
                        id={`btn-delete-receipt-${item.id}`}
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-rose-400"
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Delete receipt"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (Itemized breakdown details) - 5 cols */}
        <div className="lg:col-span-5">
          <Card className="sticky top-8 p-6 shadow-xl min-h-[500px] flex flex-col">
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4 mb-6">
              Itemized Breakdown Panel
            </h3>

            {selectedItem ? (
              <div className="flex-1 flex flex-col">
                
                {/* Visual Thermal Receipt Style Card */}
                <div className="bg-white text-slate-950 p-6 rounded-xl shadow-2xl relative overflow-hidden flex flex-col font-mono text-xs border border-slate-200">
                  {/* Jagged border effect at the top */}
                  <div className="absolute top-0 left-0 right-0 h-1 flex justify-between overflow-hidden">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="w-2.5 h-2.5 bg-slate-950 rounded-full -translate-y-1.5 shrink-0" />
                    ))}
                  </div>

                  <div className="text-center mt-2 border-b-2 border-dashed border-slate-300 pb-4">
                    <p className="text-sm font-extrabold uppercase tracking-widest">{selectedItem.vendor}</p>
                    <p className="text-[10px] text-slate-500 mt-1">AI SCANNED TRANSACTION</p>
                  </div>

                  {/* Transaction metadata */}
                  <div className="py-4 border-b-2 border-dashed border-slate-300 flex flex-col gap-1 text-[10px] text-slate-600">
                    <div className="flex justify-between">
                      <span>DATE:</span>
                      <span className="font-semibold text-slate-950">{selectedItem.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CATEGORY:</span>
                      <span className="font-semibold text-slate-950 uppercase">{selectedItem.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>TRANSACTION ID:</span>
                      <span className="truncate max-w-[120px] font-semibold text-slate-950">{selectedItem.id.substring(0, 8)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>PROCESSED TIME:</span>
                      <span>{selectedItem.uploadedAt}</span>
                    </div>
                  </div>

                  {/* Items List Table */}
                  <div className="py-4 flex-1">
                    <div className="flex justify-between font-bold text-[10px] text-slate-400 pb-2 border-b border-slate-200 uppercase">
                      <span>Item Description</span>
                      <span>Price</span>
                    </div>
                    <div className="divide-y divide-slate-100 mt-2 flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-1">
                      {selectedItem.items.map((sub, idx) => (
                        <div key={idx} className="flex justify-between pt-2">
                          <span className="text-slate-700 truncate pr-4 font-semibold uppercase">{sub.name}</span>
                          <span className="font-bold text-slate-950">${sub.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Receipt Footer Total */}
                  <div className="border-t-2 border-dashed border-slate-300 pt-4 mt-2 flex flex-col gap-1.5">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>SUBTOTAL</span>
                      <span>${selectedItem.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>TAX (INCLUDED)</span>
                      <span>$0.00</span>
                    </div>
                    <div className="flex justify-between font-extrabold text-base pt-2 text-slate-950 border-t border-slate-200">
                      <span>TOTAL PRICE</span>
                      <span>${selectedItem.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Visual thermal card bottom design */}
                  <div className="text-center mt-6 text-[9px] text-slate-400 border-t border-slate-100 pt-3">
                    <p>THANK YOU FOR SCANNING</p>
                    <p className="mt-0.5">POWERED BY LAMATIC AGENTKIT</p>
                  </div>
                </div>

                {/* Dashboard Tips */}
                <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex gap-2">
                  <Info className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    This receipt will be kept in your history. You can click on other receipt rows in the history panel to reload their specific breakdowns.
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-slate-500 p-8">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-600 mb-4">
                  <Receipt className="h-10 w-10" />
                </div>
                <p className="text-sm font-semibold">No Receipt Selected</p>
                <p className="text-xs text-slate-600 mt-1 max-w-[200px] text-center">
                  Select a receipt from the history list to inspect its itemized breakdown.
                </p>
              </div>
            )}

          </Card>
        </div>

      </div>
    </div>
  );
}
