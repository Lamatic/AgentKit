"use client";

import { useState, useRef } from "react";
import { executeBenchmark, type OrchestrationResult } from "../actions/orchestrate";
import { Play, Loader2, FileJson, CheckCircle, AlertCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  flowId: z.string().min(1, "Flow ID is required"),
  file: z.any().refine((val) => val instanceof File, "A .jsonl file is required"),
});

export default function RunForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      flowId: "",
      file: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { flowId, file } = values;
    if (!flowId.trim() || !file) return;

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      const testCases = lines.map((line, i) => {
        try {
          return JSON.parse(line);
        } catch (err) {
          throw new Error(`Invalid JSON on line ${i + 1}`);
        }
      });

      if (testCases.length === 0) {
        throw new Error("No test cases found in file");
      }

      const result = await executeBenchmark(flowId.trim(), testCases);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Navigate to the report page
      if (result.run) {
        router.push(`/report/${result.run.runId}`);
        router.refresh();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl mb-8">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
        <Play className="w-5 h-5 text-cyan-400" />
        New Benchmark Run
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="flowId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Lamatic Flow ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. ea04774a-bc7e-4134-b022-352056971fcf"
                    className="bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-600 focus-visible:ring-cyan-500/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="file"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Test Cases (.jsonl)</FormLabel>
                <FormControl>
                  <label 
                    htmlFor="jsonl-file-input"
                    className="block w-full bg-slate-950 border border-slate-800 border-dashed rounded-lg px-4 py-6 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-slate-950/50 transition-colors focus-within:ring-2 focus-within:ring-cyan-500/50 focus-within:border-cyan-500"
                  >
                    <input
                      id="jsonl-file-input"
                      type="file"
                      accept=".jsonl"
                      className="sr-only"
                      onChange={(e) => {
                        const selectedFile = e.target.files?.[0] || null;
                        onChange(selectedFile);
                      }}
                      {...fieldProps}
                    />
                    {value ? (
                      <div className="flex items-center justify-center gap-2 text-cyan-400">
                        <FileJson className="w-5 h-5" />
                        <span className="font-medium">{value.name}</span>
                      </div>
                    ) : (
                      <div className="text-slate-500">
                        <FileJson className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <span>Click to select a JSONL file</span>
                      </div>
                    )}
                  </label>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="whitespace-pre-wrap">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Running Benchmark...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Run Benchmark
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
