/**
 * SetupLayout — shared frame used by EVERY setup wizard page.
 *
 * Provides:
 *  1. Browser tab title (Head)
 *  2. Top progress stepper (SetupStepper)
 *  3. Page title
 *  4. White content card where each step puts its form/UI (children)
 *
 * Used by: device, company, company-branch, company-address, user, login
 */

import * as React from 'react';

// Head = sets the browser tab title
import { Head } from '@/components/seo';
// SetupStepper = "Step X of 5" progress UI at the top
import { SetupStepper } from '@/features/setup/components/setup-stepper';
// SetupStepNumber = 1 | 2 | 3 | 4 | 5 | 6
import type { SetupStepNumber } from '@/features/setup/config';

// Props this layout expects from each page
type SetupLayoutProps = {
  currentStep: SetupStepNumber; // which step number to highlight
  title: string; // page heading + browser tab title
  children: React.ReactNode; // the actual form/content for that step
  wide?: boolean; // wider card for device details
};

export const SetupLayout = ({
  currentStep,
  title,
  children,
  wide = false,
}: SetupLayoutProps) => {
  return (
    <>
      {/* Update browser tab title to match this step */}
      <Head title={title} />

      {/* Full-page background */}
      <div className="min-h-screen bg-slate-50">
        {/* Top header with the progress stepper */}
        <header className="border-b border-slate-200/80 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            <SetupStepper currentStep={currentStep} />
          </div>
        </header>

        {/* Main area: title + white card for page content */}
        <main
          className={
            wide
              ? 'mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8'
              : 'mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8'
          }
        >
          {/* Big page title (e.g. "Company Registration") */}
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h1>

          {/* White card — each step renders its form inside here via children */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};
