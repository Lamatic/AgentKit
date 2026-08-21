import { useState } from 'react';
import { Header } from './components/Header';
import { VendorInputSection } from './components/VendorInputSection';
import { RiskScoreHeroCard } from './components/RiskScoreHeroCard';
import { VendorInfoCard } from './components/VendorInfoCard';
import { RiskAssessmentCard } from './components/RiskAssessmentCard';
import { RecommendationsCard } from './components/RecommendationsCard';
import { SkeletonLoader } from './components/SkeletonLoader';
import { ExportModal } from './components/ExportModal';
import { AssessmentData } from './types';
import { SAMPLE_VENDOR_TEXTS, SAMPLE_ANALYSIS_RESULT } from './data/sampleData';
import { lamaticClient, parseLamaticResponse } from './utils';
import { ShieldCheck, Sparkles, CheckCircle2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [inputText, setInputText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleLoadSample = () => {
    setInputText(SAMPLE_VENDOR_TEXTS.cloudProvider);
    setAssessmentData(null);
    setError(null);
  };

  const handleLoadPreset = (key: 'cloudProvider' | 'fintechApp') => {
    setInputText(SAMPLE_VENDOR_TEXTS[key]);
    setAssessmentData(null);
    setError(null);
  };

  const handleClear = () => {
    setInputText('');
    setAssessmentData(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    const textToAnalyze = inputText.trim() || SAMPLE_VENDOR_TEXTS.cloudProvider;
    if (!inputText.trim()) {
      setInputText(SAMPLE_VENDOR_TEXTS.cloudProvider);
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisStep('Connecting to Lamatic AI Flow...');

    try {
      const flowId = import.meta.env.VITE_LAMATIC_FLOW_ID || 'your-flow-id';

      // Call Lamatic SDK executeFlow
      const response = await lamaticClient.executeFlow(flowId, {
        sampleInput: textToAnalyze,
      });

      if (response && response.status === 'success') {
        const parsed = parseLamaticResponse(response);
        setAssessmentData(parsed);
      } else {
        throw new Error(
          response?.message ||
            'Lamatic flow execution returned an unsuccessful status or failed to process the vendor description.'
        );
      }
    } catch (err: any) {
      console.error('Lamatic SDK executeFlow error:', err);
      const errorMessage =
        err?.message ||
        'Unable to execute Lamatic flow. Please verify VITE_LAMATIC_* environment parameters or service availability.';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Enterprise Navigation Header */}
      <Header
        onLoadSample={handleLoadSample}
        onClear={handleClear}
        onExport={() => setIsExportOpen(true)}
        hasData={!!assessmentData}
        isAnalyzing={isAnalyzing}
        onAnalyze={handleAnalyze}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner Context */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Third-Party Security Risk Intelligence Platform
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl font-normal">
                Analyze vendor security questionnaires, SOC 2 reports, and legal agreements to measure security, compliance, financial, operational, and legal risk exposure.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end text-xs font-semibold bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-blue-300" />
            <span>Lamatic SDK Active</span>
          </div>
        </div>

        {/* Input Section */}
        <VendorInputSection
          inputText={inputText}
          setInputText={setInputText}
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          onLoadPreset={handleLoadPreset}
          onClearText={() => setInputText('')}
        />

        {/* Professional Error Card */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-l-4 border-l-rose-600 border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                  <AlertCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">Analysis Request Error</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    The vendor risk evaluation flow could not complete successfully.
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-700 max-w-3xl">
                    {error}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setError(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Dismiss message"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleAnalyze}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Analysis</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const textToAnalyze = inputText.trim() || SAMPLE_VENDOR_TEXTS.cloudProvider;
                  let fallback = { ...SAMPLE_ANALYSIS_RESULT };
                  if (textToAnalyze.includes('NovaPay')) {
                    fallback = {
                      ...SAMPLE_ANALYSIS_RESULT,
                      vendorInfo: {
                        ...SAMPLE_ANALYSIS_RESULT.vendorInfo,
                        vendorName: 'NovaPay Gateway Corp.',
                      },
                    };
                  }
                  setAssessmentData(fallback);
                  setError(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer border border-slate-200"
              >
                Load Sample Assessment
              </button>
            </div>
          </motion.div>
        )}

        {/* Loading Progress & Skeleton Loaders */}
        {isAnalyzing ? (
          <div className="space-y-6">
            <div className="bg-blue-900 text-white rounded-2xl p-4 flex items-center gap-3.5 shadow-sm border border-blue-800 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-xs font-bold text-white mb-0.5">
                  <span>Analyzing vendor...</span>
                  <span className="text-blue-300 font-mono">Processing Request</span>
                </div>
                <p className="text-xs text-blue-200 truncate">{analysisStep || 'Extracting security controls & compliance telemetry...'}</p>
              </div>
            </div>

            {/* Skeleton Card Loaders */}
            <SkeletonLoader />
          </div>
        ) : (
          /* Results Area */
          <div className="space-y-6">
            {/* Section Heading */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Vendor Risk Assessment Results</span>
                  {assessmentData && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      Assessed
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Detailed evaluation across vendor profile, category risks, and priority roadmaps.
                </p>
              </div>
            </div>

            {/* Hero Risk Score Section */}
            {assessmentData && (
              <RiskScoreHeroCard
                assessment={assessmentData.riskAssessment}
                vendorName={
                  typeof assessmentData.vendorInfo?.vendorName === 'string'
                    ? assessmentData.vendorInfo.vendorName
                    : typeof assessmentData.vendorInfo?.vendor_name === 'string'
                    ? assessmentData.vendorInfo.vendor_name
                    : undefined
                }
              />
            )}

            {/* Main Three Cards */}
            <VendorInfoCard info={assessmentData ? assessmentData.vendorInfo : null} />

            <RiskAssessmentCard
              assessment={assessmentData ? assessmentData.riskAssessment : null}
            />

            <RecommendationsCard
              recommendations={assessmentData ? assessmentData.recommendations : null}
            />
          </div>
        )}
      </main>

      {/* Enterprise Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span className="font-bold text-slate-700">Vendor Risk Assessment Platform</span>
            <span className="text-slate-300">•</span>
            <span>Powered by Lamatic AI Flow SDK</span>
          </div>
          <p>© 2026 Enterprise Security & Governance Solution.</p>
        </div>
      </footer>

      {/* Export Report Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        data={assessmentData}
      />
    </div>
  );
}
