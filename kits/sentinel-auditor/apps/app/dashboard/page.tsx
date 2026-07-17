"use client";
// Main dashboard UI for Sentinel Auditor threat telemetry
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { runModelAudit } from "../actions/audit";

// 1. Define the strict Zod schema
const formSchema = z.object({
  userPrompt: z.string().min(1, "User prompt is required"),
  modelResponse: z.string().min(1, "Model response is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Dashboard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange", 
    defaultValues: {
      userPrompt: "",
      modelResponse: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    setError(null);
    setAuditResult(null);

    try {
      const result = await runModelAudit({ 
        userPrompt: data.userPrompt, 
        modelResponse: data.modelResponse 
      });
      setAuditResult(result);
    } catch (err: any) {
      setError(err.message || "Audit failed to execute.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to safely extract the double-nested Lamatic data
  const data = auditResult?.result?.result;

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Left: Input Panel */}
        <div className="w-full md:w-1/2 space-y-6">
          <h2 className="text-2xl font-bold">Injection Payload</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <textarea 
                {...register("userPrompt")}
                placeholder="Enter the user's prompt here..."
                className="w-full h-40 bg-muted border border-border rounded-lg p-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.userPrompt && <p className="text-destructive text-sm mt-1">{errors.userPrompt.message}</p>}
            </div>
            <div>
              <textarea 
                {...register("modelResponse")}
                placeholder="Enter the model's generated response here..."
                className="w-full h-40 bg-muted border border-border rounded-lg p-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.modelResponse && <p className="text-destructive text-sm mt-1">{errors.modelResponse.message}</p>}
            </div>
            <button 
              type="submit"
              disabled={loading || !isValid}
              className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? "Running Security Audit..." : "Execute Evaluation"}
            </button>
          </form>
        </div>

        {/* Right: Results Panel */}
        <div className="w-full md:w-1/2 bg-card border border-border rounded-xl p-6 flex flex-col">
          <h2 className="text-2xl font-bold mb-6">Audit Telemetry</h2>
          
          {!auditResult && !loading && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12">
              <p>System idle. Waiting for prompt injection.</p>
            </div>
          )}
          
          {!auditResult && !loading && error && (
            <div className="flex-1 flex flex-col items-center justify-center text-destructive py-12 animate-fade-in">
              <p className="font-medium bg-destructive/10 px-4 py-2 rounded border border-destructive/20">{error}</p>
            </div>
          )}
          
          {loading && (
             <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-12">
               <p className="text-primary font-mono text-sm animate-pulse">Analyzing neural dimensions...</p>
             </div>
          )}
          
          {/* Parsed Human-Readable UI */}
          {auditResult && data && (
            <div className="space-y-6 animate-fade-in">
              
             {/* Summary Badge */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg border border-border">
                <div>
                  <h3 className="text-lg font-bold">Operation Success</h3>
                  <p className="text-sm text-muted-foreground">Overall Score: {data?.summary?.overall_score ?? 'N/A'}</p>
                </div>
                <div className={`px-4 py-2 rounded-full font-bold text-sm ${
                  data?.summary?.risk_level === 'High' ? 'bg-destructive/20 text-destructive border border-destructive/30' : 
                  data?.summary?.risk_level === 'Medium' ? 'bg-orange-500/20 text-orange-600 border border-orange-500/30' : 
                  data?.summary?.risk_level === 'Low' ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30' :
                  'bg-muted text-muted-foreground border border-border'
                }`}>
                  {data?.summary?.risk_level ?? 'Unknown'} Risk
                </div>
              </div>

              {/* Dimension Cards */}
              <div className="grid grid-cols-1 gap-3">
                {Object.entries(data?.dimensions || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-4 bg-card border border-border rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold capitalize text-foreground">
                        {key.replace('_', ' ')}
                      </h4>
                      <span className="text-xs font-bold bg-secondary text-secondary-foreground px-2 py-1 rounded">
                        Score: {value?.score ?? 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{value?.justification ?? 'No justification provided.'}</p>
                  </div>
                ))}
              </div>
               

              {/* Collapsible Raw JSON Toggle */}
              <details className="mt-4 group">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-primary transition-colors font-medium">
                  View Raw JSON Telemetry
                </summary>
                <pre className="mt-4 p-4 bg-secondary rounded-lg text-xs overflow-auto border border-border max-h-64 text-foreground">
                  {JSON.stringify(auditResult, null, 2)}
                </pre>
              </details>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}