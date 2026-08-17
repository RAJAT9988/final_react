import { HttpResponse, http } from 'msw';

import { env } from '@/config/env';

import { networkDelay } from '../utils';

const COMPANY_ID = '11111111-1111-1111-1111-111111111111';
const BRANCH_ID = '22222222-2222-2222-2222-222222222222';
const ADDRESS_ID = '33333333-3333-3333-3333-333333333333';
const COUNTRY_ID = '44444444-4444-4444-4444-444444444444';
const STATE_ID = '55555555-5555-5555-5555-555555555555';

type RegisterCompanyBody = {
  company_name: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_mobile_no?: string;
  contact_person_designation?: string;
  company_description?: string;
};

type RegisterBranchBody = {
  company_id: string;
  branch_name: string;
  branch_contact_person_name?: string;
  branch_contact_person_email?: string;
  branch_contact_person_mobile_no?: string;
  branch_contact_person_designation?: string;
};

type RegisterAddressBody = {
  country_id: string;
  state_id: string;
  city: string;
  area?: string | null;
  locality?: string | null;
  landmark?: string | null;
  street?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  branch_id?: string | null;
};

export const companyHandlers = [
  http.post(`${env.API_URL}/v1/companies`, async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as RegisterCompanyBody;
    const now = new Date().toISOString();

    return HttpResponse.json(
      {
        company_id: COMPANY_ID,
        company_name: body.company_name,
        contact_person_name: body.contact_person_name ?? null,
        contact_person_email: body.contact_person_email ?? null,
        contact_person_mobile_no: body.contact_person_mobile_no ?? null,
        contact_person_designation: body.contact_person_designation ?? null,
        company_description: body.company_description ?? null,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      },
      { status: 201 },
    );
  }),

  http.post(
    `${env.API_URL}/v1/companies/:companyId/branches`,
    async ({ request, params }) => {
      await networkDelay();
      const body = (await request.json()) as RegisterBranchBody;
      const now = new Date().toISOString();

      return HttpResponse.json(
        {
          branch_id: BRANCH_ID,
          company_id: String(params.companyId),
          branch_name: body.branch_name,
          branch_contact_person_name: body.branch_contact_person_name ?? null,
          branch_contact_person_email: body.branch_contact_person_email ?? null,
          branch_contact_person_mobile_no:
            body.branch_contact_person_mobile_no ?? null,
          branch_contact_person_designation:
            body.branch_contact_person_designation ?? null,
          is_deleted: false,
          created_at: now,
          updated_at: now,
        },
        { status: 201 },
      );
    },
  ),

  http.get(`${env.API_URL}/v1/countries`, async () => {
    await networkDelay();
    const now = new Date().toISOString();
    return HttpResponse.json([
      {
        country_id: COUNTRY_ID,
        country_name: 'India',
        created_at: now,
        updated_at: now,
      },
    ]);
  }),

  http.get(`${env.API_URL}/v1/countries/:countryId/states`, async ({ params }) => {
    await networkDelay();
    const now = new Date().toISOString();
    return HttpResponse.json([
      {
        state_id: STATE_ID,
        state_name: 'Karnataka',
        country_id: String(params.countryId),
        created_at: now,
        updated_at: now,
      },
    ]);
  }),

  http.post(`${env.API_URL}/v1/addresses`, async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as RegisterAddressBody;
    const now = new Date().toISOString();

    return HttpResponse.json(
      {
        address_id: ADDRESS_ID,
        country_id: body.country_id,
        state_id: body.state_id,
        city: body.city,
        area: body.area ?? null,
        locality: body.locality ?? null,
        landmark: body.landmark ?? null,
        street: body.street ?? null,
        postal_code: body.postal_code ?? null,
        latitude: body.latitude ?? null,
        longitude: body.longitude ?? null,
        branch_id: body.branch_id ?? null,
        is_deleted: false,
        created_at: now,
        updated_at: now,
      },
      { status: 201 },
    );
  }),
];
