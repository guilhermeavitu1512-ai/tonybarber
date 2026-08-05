/**
 * StepIndicator.tsx
 * Visual progress bar for multi-step flows (BookingFlow).
 * Shows completed, current and upcoming steps.
 */
interface StepIndicatorProps {
  currentStep: number;   // 1-based
  totalSteps: number;
  labels?: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  const defaultLabels = ['Serviço', 'Horário', 'Dados', 'Confirmação'];
  const stepLabels = labels ?? defaultLabels.slice(0, totalSteps);

  return (
    <div className="flex items-center w-full mb-6 px-1" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const stepNum = i + 1;
        const isDone = stepNum < currentStep;
        const isCurrent = stepNum === currentStep;

        return (
          <div key={stepNum} className="flex items-center flex-1 last:flex-none">
            {/* Step dot */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-300 border-2
                  ${isDone ? 'bg-orange-500 border-orange-500 text-white' : ''}
                  ${isCurrent ? 'bg-transparent border-orange-500 text-orange-500' : ''}
                  ${!isDone && !isCurrent ? 'bg-transparent border-neutral-700 text-neutral-600' : ''}
                `}
              >
                {isDone ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : stepNum}
              </div>
              {stepLabels[i] && (
                <span className={`text-[10px] font-medium whitespace-nowrap ${isCurrent ? 'text-orange-400' : isDone ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {stepLabels[i]}
                </span>
              )}
            </div>

            {/* Connector line */}
            {stepNum < totalSteps && (
              <div className="flex-1 mx-1.5 mb-3.5">
                <div
                  className={`h-0.5 w-full transition-all duration-500 ${isDone ? 'bg-orange-500' : 'bg-neutral-800'}`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
