import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { z } from "zod";
import {
  BookOpen,
  Layers,
  FolderTree,
  FileCode2,
  ListChecks,
  Network,
  GraduationCap,
} from "lucide-react";

const folderEntrySchema = z.object({
  path: z.string(),
  description: z.string(),
}).passthrough();

const keyFileEntrySchema = z.object({
  file: z.string(),
  whyImportant: z.string(),
}).passthrough();

const quizEntrySchema = z.object({
  question: z.string(),
  answer: z.string(),
}).passthrough();

const onboardingReportSchema = z.object({
  projectOverview: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  folderStructure: z.array(folderEntrySchema).optional(),
  keyFiles: z.array(keyFileEntrySchema).optional(),
  setupSteps: z.array(z.string()).optional(),
  architectureNotes: z.string().optional(),
  quiz: z.array(quizEntrySchema).optional(),
});

export type OnboardingReport = z.infer<typeof onboardingReportSchema>;

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 text-primary">
          <Icon className="w-4 h-4" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function OnboardingReportView({ report }: { report: OnboardingReport }) {
  return (
    <div className="space-y-4">
      {report.projectOverview && (
        <Section icon={BookOpen} title="Project overview">
          <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
            {report.projectOverview}
          </p>
        </Section>
      )}

      {report.techStack && report.techStack.length > 0 && (
        <Section icon={Layers} title="Tech stack">
          <div className="flex flex-wrap gap-2">
            {report.techStack.map((t, i) => (
              <Badge key={`${t}-${i}`} variant="secondary">
                {t}
              </Badge>
            ))}
          </div>
        </Section>
      )}

      {report.folderStructure && report.folderStructure.length > 0 && (
        <Section icon={FolderTree} title="Folder structure">
          <ul className="space-y-3">
            {report.folderStructure.map((f, i) => (
              <li key={`${f.path}-${i}`} className="border-l-2 border-border pl-3">
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{f.path}</code>
                <p className="text-sm text-muted-foreground mt-1">{f.description}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {report.keyFiles && report.keyFiles.length > 0 && (
        <Section icon={FileCode2} title="Key files">
          <ul className="space-y-3">
            {report.keyFiles.map((f, i) => (
              <li key={`${f.file}-${i}`} className="border-l-2 border-border pl-3">
                <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{f.file}</code>
                <p className="text-sm text-muted-foreground mt-1">{f.whyImportant}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {report.setupSteps && report.setupSteps.length > 0 && (
        <Section icon={ListChecks} title="Setup steps">
          <ol className="space-y-2 list-decimal list-inside">
            {report.setupSteps.map((s, i) => (
              <li key={i} className="text-sm leading-relaxed">
                {s}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {report.architectureNotes && (
        <Section icon={Network} title="Architecture notes">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.architectureNotes}</p>
        </Section>
      )}

      {report.quiz && report.quiz.length > 0 && (
        <Section icon={GraduationCap} title="Quiz">
          <Accordion type="single" collapsible className="w-full">
            {report.quiz.map((q, i) => (
              <AccordionItem key={i} value={`q-${i}`}>
                <AccordionTrigger className="text-left text-sm">{q.question}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {q.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Section>
      )}
    </div>
  );
}

export function parseOnboardingReport(raw: unknown): OnboardingReport | null {
  let value: unknown = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  // unwrap common nested shapes
  if (v.result && typeof v.result === "object") return parseOnboardingReport(v.result);
  if (v.output && typeof v.output === "object") return parseOnboardingReport(v.output);
  if (v.generatedResponse) return parseOnboardingReport(v.generatedResponse);

  const parsed = onboardingReportSchema.safeParse(v);
  if (parsed.success) return parsed.data;
  console.warn("Onboarding report shape mismatch:", parsed.error.issues);
  return null;
}
