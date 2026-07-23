export interface DraftAnswerInput {
  new_question: string;
  past_answers: string;
}

export interface DraftAnswerOutput {
  response: string;
}

export interface ApiResponse {
  success: boolean;
  data?: DraftAnswerOutput;
  error?: string;
  timestamp?: string;
}
