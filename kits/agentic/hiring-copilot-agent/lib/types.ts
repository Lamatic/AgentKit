export type Response = {
    candidate: {
        name: string;
        skills: [string],
        experience: number
    };
    evaluation: {
        final_score: number;
        verdict: "Perfect Fit" | "Strong Fit" | "Good Fit" | "Weak Fit";
        breakdown: {
            skill_match: number;
            experience_match: number;
            project_relevance: number;
        };
    };
    reasoning: string;
}

export interface ToastProps {
  id: string | number;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}