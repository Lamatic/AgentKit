'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowRight, Lightbulb, Sparkles, AlertCircle } from 'lucide-react';

const ideaSchema = z.object({
  idea: z
    .string()
    .trim()
    .min(5, 'Please enter a startup idea with at least 5 characters.')
    .max(1000, 'Idea description must be under 1000 characters.'),
});

type IdeaFormData = z.infer<typeof ideaSchema>;

interface IdeaInputProps {
  onSubmit: (idea: string) => void;
  isLoading: boolean;
}

const EXAMPLE_IDEAS = [
  {
    title: '🚀 Micro-SaaS Dynamic Pricing',
    idea: 'An AI copilot that monitors Stripe churn and competitor pricing pages to recommend dynamic tier pricing for solo SaaS founders.',
  },
  {
    title: '⚡ Notion-to-Shopify Sync',
    idea: 'A lightweight sync engine that lets digital creators manage product inventory and digital downloads inside Notion and auto-publish to Shopify.',
  },
  {
    title: '🛡️ Solo SOC-2 Compliance',
    idea: 'Automated compliance checklist and screenshot evidence collector tailored for single-founder dev tools selling to enterprise.',
  },
  {
    title: '🎙️ AI Podcast to Newsletter',
    idea: 'An agent that takes YouTube / Spotify podcast episodes and generates deeply researched, editorial-grade Substack newsletters with key timestamps.',
  },
];

export function IdeaInput({ onSubmit, isLoading }: IdeaInputProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<IdeaFormData>({
    resolver: zodResolver(ideaSchema),
    mode: 'onChange',
    defaultValues: {
      idea: '',
    },
  });

  const ideaValue = watch('idea');

  const onFormSubmit = (data: IdeaFormData) => {
    if (isLoading) return;
    onSubmit(data.idea);
  };

  const handleSelectExample = (idea: string) => {
    setValue('idea', idea, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <form onSubmit={handleSubmit(onFormSubmit)} className="relative group">
        <div className="relative rounded-2xl bg-card/90 border border-border p-2 shadow-2xl backdrop-blur-xl transition-all duration-300 focus-within:border-primary/50 focus-within:shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <label htmlFor="startup-idea-input" className="sr-only">
            Startup idea
          </label>
          <textarea
            id="startup-idea-input"
            aria-label="Startup idea"
            {...register('idea')}
            disabled={isLoading}
            placeholder="Enter your startup idea (e.g., A tool that converts Figma designs directly into production-ready React Native components for solo mobile devs)..."
            rows={4}
            className="w-full bg-transparent px-4 py-3 text-foreground placeholder:text-muted-foreground resize-none outline-none text-base sm:text-lg rounded-xl focus:ring-0 leading-relaxed disabled:opacity-60"
          />

          {errors.idea && (
            <div className="flex items-center gap-1.5 px-4 py-1 text-xs text-destructive font-medium animate-in fade-in duration-200">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errors.idea.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 border-t border-border/60 mt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Be specific about target user & problem for the sharpest analysis</span>
            </div>

            <button
              type="submit"
              disabled={!ideaValue?.trim() || !isValid || isLoading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
                  <span>Scanning Market...</span>
                </>
              ) : (
                <>
                  <span>Scan Market & Validate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Quick Example Presets */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium px-1">
          <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
          <span>Or try one of these example ideas:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {EXAMPLE_IDEAS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectExample(item.idea)}
              disabled={isLoading}
              className="text-left p-3 rounded-xl bg-card/60 hover:bg-card-muted/80 border border-border hover:border-muted-foreground/30 text-xs transition-all duration-150 group cursor-pointer disabled:opacity-50"
            >
              <div className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
                {item.title}
              </div>
              <p className="text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                {item.idea}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
