// Cookie helper used by the fake API in the browser
import Cookies from 'js-cookie';
// MSW helpers to define fake HTTP endpoints
import { HttpResponse, http } from 'msw';

// API base URL from env
import { env } from '@/config/env';

// In-memory mock database + save helper
import {
  authenticate,
  hash,
  AUTH_COOKIE,
  networkDelay,
  decode,
  sanitizeUser,
} from '../utils';
import { db, persistDb } from '../db';

// Body shape for signup — matches real backend POST /v1/users/signup
type SignupBody = {
  userType: 'Administrator' | 'Customer';
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  mobile?: string;
};

// Body shape for login requests
type LoginBody = {
  email: string;
  password: string;
};

// All fake auth endpoints used by the frontend
export const authHandlers = [
  // ---------- REGISTER (real backend path; used by unit tests via MSW) ----------
  http.post(`${env.API_URL}/v1/users/signup`, async ({ request }) => {
    // Fake network lag so UI loading states are visible
    await networkDelay();
    try {
      // Read JSON body from the request
      const userObject = (await request.json()) as SignupBody;

      // Check if email is already taken
      const existingUser = db.user.findFirst({
        where: {
          email: {
            equals: userObject.email,
          },
        },
      });

      // Reject duplicate emails
      if (existingUser) {
        return HttpResponse.json(
          { message: 'The user already exists' },
          { status: 400 },
        );
      }

      // Save the new user (password stored hashed, not plain text)
      const created = db.user.create({
        firstName: userObject.firstName,
        lastName: userObject.lastName,
        email: userObject.email,
        password: hash(userObject.password),
      });

      // Persist users to localStorage so refresh keeps accounts
      await persistDb('user');

      // Real backend returns the created user only (no JWT)
      const { password: _password, ...user } = created;
      return HttpResponse.json(user);
    } catch (error: any) {
      // Unexpected failure
      return HttpResponse.json(
        { message: error?.message || 'Server Error' },
        { status: 500 },
      );
    }
  }),

  // ---------- LOGIN (api_back: form username=email + password) ----------
  http.post(`${env.API_URL}/api/v1/auth/login`, async ({ request }) => {
    await networkDelay();

    try {
      const form = await request.formData();
      const email = String(form.get('username') ?? '');
      const password = String(form.get('password') ?? '');
      const result = authenticate({ email, password } as LoginBody);

      Cookies.set(AUTH_COOKIE, result.jwt, { path: '/' });

      return HttpResponse.json({
        code: 0,
        message: 'success',
        data: {
          access_token: result.jwt,
          refresh_token: {
            token: `refresh_${result.jwt}`.slice(0, 48).padEnd(48, '0'),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          token_type: 'bearer',
        },
      });
    } catch (error: any) {
      return HttpResponse.json(
        { code: 1000, message: error?.message || 'Server Error' },
        { status: 400 },
      );
    }
  }),

  // ---------- LOGOUT ----------
  http.post(`${env.API_URL}/auth/logout`, async () => {
    await networkDelay();

    Cookies.remove(AUTH_COOKIE);

    return HttpResponse.json(
      { message: 'Logged out' },
      {
        headers: {
          'Set-Cookie': `${AUTH_COOKIE}=; Path=/;`,
        },
      },
    );
  }),

  // ---------- CURRENT USER (api_back profile) ----------
  http.get(`${env.API_URL}/api/v1/profile`, async ({ request }) => {
    await networkDelay();

    try {
      const authHeader = request.headers.get('Authorization');
      const bearer = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : Cookies.get(AUTH_COOKIE);

      if (!bearer) {
        return HttpResponse.json(
          { code: 1030, message: 'Unauthorized' },
          { status: 401 },
        );
      }

      const decoded = decode(bearer) as { id: string };
      const user = db.user.findFirst({
        where: { id: { equals: decoded.id } },
      });

      if (!user) {
        return HttpResponse.json(
          { code: 1030, message: 'Unauthorized' },
          { status: 401 },
        );
      }

      return HttpResponse.json({
        code: 0,
        message: 'success',
        data: sanitizeUser(user),
      });
    } catch (error: any) {
      return HttpResponse.json(
        { code: 1030, message: error?.message || 'Unauthorized' },
        { status: 401 },
      );
    }
  }),
];
