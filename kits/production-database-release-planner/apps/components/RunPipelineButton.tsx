import { LoaderCircle, Play } from "lucide-react";

type RunPipelineButtonProps = {
  isLoading: boolean;
  onClick: () => void;
  validationMessage: string | null;
};

export default function RunPipelineButton({
  isLoading,
  onClick,
  validationMessage,
}: RunPipelineButtonProps) {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-200 pt-8 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-2">
        <button
          className="inline-flex min-w-[280px] items-center justify-center gap-3 rounded-xl border border-blue-700 bg-blue-600 px-6 py-4 text-base font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.22)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-500"
          disabled={isLoading}
          onClick={onClick}
          type="button"
        >
          {isLoading ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Running Pipeline...
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Run Release Safety Pipeline
            </>
          )}
        </button>

        {validationMessage ? (
          <p className="text-sm text-rose-600">{validationMessage}</p>
        ) : null}
      </div>

      <div className="text-base text-slate-500">
        <p>SQL is sent to the pipeline adapter; no database statements are executed here.</p>
      </div>
    </div>
  );
}
