/**
 * Blocks direct URL access to later setup steps until prerequisites are done.
 */

import { Navigate } from 'react-router';

import {
  getSetupStepRedirect,
  type SetupStepNumber,
} from '@/features/setup/config';

type SetupStepGuardProps = {
  step: SetupStepNumber;
  children: React.ReactNode;
};

export const SetupStepGuard = ({ step, children }: SetupStepGuardProps) => {
  const redirectTo = getSetupStepRedirect(step);

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};
