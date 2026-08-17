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

// Body shape for setup user registration — POST /v1/auth/register
type RegisterBody = {
  company_id: string;
  name: string;
  email: string;
  password: string;
};

// Body shape for login requests
type LoginBody = {
  email: string;
  password: string;
};

// All fake auth endpoints used by the frontend
export const authHandlers = [
  // ---------- REGISTER (setup user step: POST /v1/auth/register) ----------
  http.post(`${env.API_URL}/v1/auth/register`, async ({ request }) => {
    await networkDelay();
    try {
      const body = (await request.json()) as RegisterBody;

      const existingUser = db.user.findFirst({
        where: {
          email: {
            equals: body.email,
          },
        },
      });

      if (existingUser) {
        return HttpResponse.json(
          { message: 'The user already exists' },
          { status: 400 },
        );
      }

      const created = db.user.create({
        firstName: body.name,
        lastName: '',
        email: body.email,
        password: hash(body.password),
      });

      await persistDb('user');

      return HttpResponse.json(
        {
          user_id: created.id,
          role_id: 1,
          company_id: body.company_id,
          name: body.name,
          email: body.email,
          status: 'active',
          mfa_enabled: false,
          is_deleted: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { status: 201 },
      );
    } catch (error: any) {
      return HttpResponse.json(
        { message: error?.message || 'Server Error' },
        { status: 500 },
      );
    }
  }),

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

  // ---------- LOGIN (JSON { email, password }) ----------
  http.post(`${env.API_URL}/v1/auth/login`, async ({ request }) => {
    await networkDelay();

    try {
      const body = (await request.json()) as LoginBody;
      const result = authenticate({
        email: body.email,
        password: body.password,
      });

      Cookies.set(AUTH_COOKIE, result.jwt, { path: '/' });

      return HttpResponse.json({
        access_token: result.jwt,
        refresh_token: `refresh_${result.jwt}`.slice(0, 48).padEnd(48, '0'),
        token_type: 'bearer',
        mfa_required: false,
        challenge_token: null,
      });
    } catch (error: any) {
      return HttpResponse.json(
        { detail: error?.message || 'Server Error' },
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

  // ---------- CURRENT USER (GET /v1/profile → UserDTO) ----------
  http.get(`${env.API_URL}/v1/profile`, async ({ request }) => {
    await networkDelay();

    try {
      const authHeader = request.headers.get('Authorization');
      const bearer = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : Cookies.get(AUTH_COOKIE);

      if (!bearer) {
        return HttpResponse.json(
          { detail: 'Unauthorized' },
          { status: 401 },
        );
      }

      const decoded = decode(bearer) as { id: string };
      const user = db.user.findFirst({
        where: { id: { equals: decoded.id } },
      });

      if (!user) {
        return HttpResponse.json(
          { detail: 'Unauthorized' },
          { status: 401 },
        );
      }

      const now = new Date().toISOString();
      return HttpResponse.json({
        user_id: user.id,
        name: user.firstName || user.email,
        email: user.email,
        role_id: 1,
        company_id: '11111111-1111-1111-1111-111111111111',
        status: 'active',
        mfa_enabled: false,
        role_name: 'owner',
        is_deleted: false,
        created_at: now,
        updated_at: now,
      });
    } catch (error: any) {
      return HttpResponse.json(
        { detail: error?.message || 'Unauthorized' },
        { status: 401 },
      );
    }
  }),
];
