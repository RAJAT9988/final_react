/**
 * SetupStepper — progress bar at the top of every setup page.
 *
 * Shows:
 *  - "Step X of N · Label"
 *  - Circles for each step (completed = check, active = filled, upcoming = empty)
 *  - Lines between circles that fill when a step is done
 *
 * Step list comes from SETUP_STEPS in config.ts
 */

// Check icon used for completed steps
import { Check } from 'lucide-react';

// SETUP_STEPS = the wizard steps; SetupStepNumber = 1..7
import { SETUP_STEPS, type SetupStepNumber } from '@/features/setup/config';
// cn = merge Tailwind classes (active / completed / upcoming styles)
import { cn } from '@/utils/cn';

type SetupStepperProps = {
  currentStep: SetupStepNumber; // which step the user is on right now
};

export const SetupStepper = ({ currentStep }: SetupStepperProps) => {
  // Total number of steps (currently 7)
  const total = SETUP_STEPS.length;
  // Find label for current step (e.g. "Company")
  const currentMeta = SETUP_STEPS.find((s) => s.step === currentStep);

  return (
    // nav = landmark for accessibility ("Setup progress")
    <nav aria-label="Setup progress" className="w-full">
      {/* Top text: "Device setup" + "Step 3 of 5 · Company" */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Device setup
          </p>
          <p className="mt-1 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">
              Step {currentStep} of {total}
            </span>
            {/* Show current step label if found */}
            {currentMeta ? (
              <span className="text-slate-500"> · {currentMeta.label}</span>
            ) : null}
          </p>
        </div>
      </div>

      {/* Horizontal list of step circles + labels */}
      <ol className="flex w-full items-start">
        {SETUP_STEPS.map(({ step, label }, index) => {
          const isActive = step === currentStep; // this is the current step
          const isCompleted = step < currentStep; // already finished
          const isUpcoming = step > currentStep; // not reached yet
          const isLast = index === SETUP_STEPS.length - 1; // last item (no line after)

          return (
            <li
              key={step}
              className="relative flex min-w-0 flex-1 flex-col items-center"
            >
              {/* Connector line to the NEXT step (skip for last step) */}
              {!isLast ? (
                <div
                  aria-hidden
                  className="absolute left-[calc(50%+18px)] right-[calc(-50%+18px)] top-4 h-px bg-slate-200"
                >
                  {/* Dark fill grows when this step is completed */}
                  <div
                    className={cn(
                      'h-full bg-slate-900 transition-all duration-300',
                      isCompleted ? 'w-full' : 'w-0',
                    )}
                  />
                </div>
              ) : null}

              {/* Circle: check / number / empty style */}
              <span
                className={cn(
                  'relative z-10 flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  isCompleted && 'bg-slate-900 text-white',
                  isActive &&
                    'bg-slate-900 text-white shadow-[0_0_0_4px_rgba(15,23,42,0.12)]',
                  isUpcoming &&
                    'border border-slate-300 bg-white text-slate-400',
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                {/* Completed steps show a check icon; others show the step number */}
                {isCompleted ? (
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                ) : (
                  step
                )}
              </span>

              {/* Label under the circle (Login, Company, etc.) */}
              <span
                className={cn(
                  'mt-2 max-w-[7rem] truncate text-center text-xs leading-tight sm:max-w-none',
                  isActive && 'font-semibold text-slate-900',
                  isCompleted && 'font-medium text-slate-600',
                  isUpcoming && 'font-medium text-slate-400',
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
