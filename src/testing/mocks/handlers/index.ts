import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { networkDelay } from '../utils';

import { authHandlers } from './auth';
import { camerasHandlers } from './cameras';
import { companyHandlers } from './company';
import { devicesHandlers } from './devices';

export const handlers = [
  ...authHandlers,
  ...companyHandlers,
  ...camerasHandlers,
  ...devicesHandlers,
  http.get(`${env.API_URL}/healthcheck`, async () => {
    await networkDelay();
    return HttpResponse.json({ ok: true });
  }),
];
