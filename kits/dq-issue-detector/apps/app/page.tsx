"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import {
  Clipboard,
  ClipboardCheck,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
  AlertTriangle,
  FileText,
  Upload,
  Info
} from "lucide-react";
import { orchestrateAnalysis } from "../actions/orchestrate";

const SAMPLE_CSV = `id,name,email,age,signup_date,status
1,John Doe,john.doe@example.com,28,2023-01-15,Active
2,Jane Smith,jane.smith@example.org,34,2023-02-20,Active
3,Bob Johnson,,forty-five,2023-03-10,Pending
4,Alice Williams,alice.w@example,22,04-12-2023,Active
5,Charlie Brown,charlie@example.com,31,,Inactive
2,Jane Smith,jane.smith@example.org,34,2023-02-20,Active
7,David Lee,david.lee@domain.com,255,2023-05-02,Active
8,Eva Green,eva.green@example.com,-5,2023-06-15,Active
9,Frank Wright,frank@example.com,40,2023-07-22,unknown`;

export default function Home() {
  const [csvContent, setCsvContent] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Parse CSV for local preview table (up to 5 rows)
  const previewData = useMemo(() => {
    if (!csvContent) return null;
    const lines = csvContent.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;

    const parseLine = (line: string) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ""));
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ""));
      return result;
    };

    try {
      const headers = parseLine(lines[0]);
      const rows = lines.slice(1).map(parseLine);
      return { headers, rows: rows.slice(0, 5), totalRows: rows.length };
    } catch (e) {
      return null;
    }
  }, [csvContent]);

  const loadSample = () => {
    setCsvContent(SAMPLE_CSV);
    setErrorMessage(null);
  };

  const clearAll = () => {
    setCsvContent("");
    setInstructions("");
    setAnalysisReport(null);
    setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    if (!csvContent.trim()) {
      setErrorMessage("Please enter or load some CSV data first.");
      return;
    }
    setErrorMessage(null);
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      const csvFile = new File([csvContent], "dataset.csv", { type: "text/csv" });
      formData.append("file", csvFile);

      const res = await orchestrateAnalysis(formData);
      if (res.success && res.data) {
        setAnalysisReport(res.data);
      } else {
        setErrorMessage(res.error || "Failed to analyze dataset.");
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyReport = () => {
    if (!analysisReport) return;
    navigator.clipboard.writeText(analysisReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-6 px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Data Quality Issue Detector
              </h1>
              <p className="text-sm text-slate-500">
                Scan and audit your datasets using Lamatic AI agents
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadSample}
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold px-4 py-2 rounded-lg text-sm transition-colors border border-indigo-200"
            >
              Load Sample Data
            </button>
            <button
              onClick={clearAll}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-7xl mx-auto px-6 mt-8">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-800">Error</h4>
              <p className="text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Column: Input Data */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-indigo-600" />
                  Dataset CSV Input
                </h2>
                {previewData && (
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                    {previewData.totalRows} records
                  </span>
                )}
              </div>
              
              <textarea
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Paste your CSV data here... e.g.
id,name,email,age
1,John Doe,john@example.com,28
2,Jane Smith,,forty-five"
                className="w-full h-80 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono text-sm leading-relaxed mb-4"
              />

              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-slate-500" />
                  Custom Analysis Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Focus on finding duplicates or validating age ranges..."
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-colors shadow-sm"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Analyzing Dataset...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Run Data Quality Scan</span>
                  </>
                )}
              </button>
            </div>

            {/* Local Preview Table */}
            {previewData && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  CSV Preview (First 5 Rows)
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 font-bold text-slate-700">
                      <tr>
                        {previewData.headers.map((h, i) => (
                          <th key={i} className="px-4 py-3 border-b border-slate-200">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100 text-slate-800">
                      {previewData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                          {previewData.headers.map((_, cIdx) => (
                            <td key={cIdx} className="px-4 py-2.5">
                              {row[cIdx] !== undefined ? row[cIdx] : <span className="text-red-400 italic">null</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.totalRows > 5 && (
                  <p className="text-xs text-slate-500 mt-2 italic">
                    Showing 5 of {previewData.totalRows} rows.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Report Display */}
          <div className="h-full">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-full min-h-[500px] flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
                <h2 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                  Quality Analysis Report
                </h2>
                {analysisReport && (
                  <button
                    onClick={handleCopyReport}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {copied ? (
                      <>
                        <ClipboardCheck className="h-4 w-4 text-green-600" />
                        <span className="text-green-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Clipboard className="h-4 w-4" />
                        <span>Copy Report</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {isAnalyzing ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent mb-4" />
                  <h3 className="font-bold text-slate-800">Processing Dataset</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-xs">
                    Our AI Agent is scanning the columns and evaluating record formats. This may take up to 30 seconds.
                  </p>
                </div>
              ) : analysisReport ? (
                <div className="flex-1 overflow-y-auto prose max-w-none text-sm text-slate-800 leading-relaxed pr-2">
                  <ReactMarkdown>{analysisReport}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 text-center border-2 border-dashed border-slate-200 rounded-xl">
                  <FileText className="h-12 w-12 mb-3 text-slate-300" />
                  <h4 className="font-bold text-slate-600 text-sm">No Report Generated Yet</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-[240px]">
                    Paste CSV data and trigger the data quality scan to view the results.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
