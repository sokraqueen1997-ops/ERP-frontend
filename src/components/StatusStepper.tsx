interface StatusStage {
  key: string;
  label: string;
}

interface StatusStepperProps {
  stages: StatusStage[];
  /** Index of the stage the record has reached. */
  currentIndex: number;
  /** True if the current stage is still underway (not yet fully complete) — renders as "in progress" instead of done. */
  inProgress?: boolean;
  /** True if the record was cancelled — replaces the whole stepper with a single red badge. */
  cancelled?: boolean;
  cancelledLabel?: string;
}

/**
 * A horizontal stage-progress bar, similar to Odoo's classic status bar widget:
 * completed stages show a filled brass circle with a checkmark, the current stage
 * is highlighted in teal, and future stages stay muted grey.
 */
export function StatusStepper({
  stages,
  currentIndex,
  inProgress = false,
  cancelled = false,
  cancelledLabel = 'ملغى',
}: StatusStepperProps) {
  if (cancelled) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700">
        <span>✕</span>
        {cancelledLabel}
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {stages.map((stage, i) => {
        const isComplete = i < currentIndex || (i === currentIndex && !inProgress);
        const isCurrent = i === currentIndex;
        const isFuture = i > currentIndex;

        return (
          <div key={stage.key} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isComplete
                    ? 'bg-brass-500 text-white'
                    : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isComplete ? '✓' : i + 1}
              </div>
              <span
                className={`whitespace-nowrap text-xs font-medium ${
                  isFuture ? 'text-gray-400' : isCurrent ? 'text-blue-700' : 'text-gray-700'
                }`}
              >
                {stage.label}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className={`mx-2 h-0.5 w-8 shrink-0 sm:w-12 ${i < currentIndex ? 'bg-brass-500' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
