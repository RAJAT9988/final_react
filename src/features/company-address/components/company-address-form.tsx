/**
 * Company address form — setup wizard step 4.
 * Fields match Address table (form fields only; audit flags omitted).
 * Submits to POST /v1/addresses.
 * Form always starts empty and resets after success.
 */

import { useRef, useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Form, Input, Select } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { useCountries } from '@/features/company-address/api/get-countries';
import { useStatesByCountry } from '@/features/company-address/api/get-states';
import { useRegisterAddress } from '@/features/company-address/api/register-address';
import { completeSetupStep, readSetupState } from '@/features/setup/config';

const addressSchema = z.object({
  countryId: z.string().min(1, 'Required'),
  stateId: z.string().min(1, 'Required'),
  city: z
    .string()
    .trim()
    .min(1, 'Required')
    .max(64, 'Must be at most 64 characters'),
  area: z
    .string()
    .trim()
    .min(1, 'Required')
    .max(128, 'Must be at most 128 characters'),
  locality: z
    .string()
    .trim()
    .min(1, 'Required')
    .max(128, 'Must be at most 128 characters'),
  landmark: z.string().trim().max(128, 'Must be at most 128 characters'),
  street: z
    .string()
    .trim()
    .min(1, 'Required')
    .max(128, 'Must be at most 128 characters'),
  postalCode: z
    .string()
    .trim()
    .min(1, 'Required')
    .max(20, 'Must be at most 20 characters'),
  latitude: z.string().trim().max(64, 'Must be at most 64 characters'),
  longitude: z.string().trim().max(64, 'Must be at most 64 characters'),
});

type AddressFormInput = z.infer<typeof addressSchema>;

const emptyAddress: AddressFormInput = {
  countryId: '',
  stateId: '',
  city: '',
  area: '',
  locality: '',
  landmark: '',
  street: '',
  postalCode: '',
  latitude: '',
  longitude: '',
};

type CompanyAddressFormProps = {
  onBack: () => void;
  onSuccess: () => void;
};

export const CompanyAddressForm = ({
  onBack,
  onSuccess,
}: CompanyAddressFormProps) => {
  const { addNotification } = useNotifications();
  const resetRef = useRef<UseFormReturn<AddressFormInput>['reset'] | null>(
    null,
  );
  const [selectedCountryId, setSelectedCountryId] = useState('');

  const setup = readSetupState();
  const company = setup.company;
  const branch = setup.companyBranch;

  const countriesQuery = useCountries();
  const statesQuery = useStatesByCountry({
    countryId: selectedCountryId,
  });

  const registerAddress = useRegisterAddress();

  if (!company?.companyId || !branch?.branchId) {
    return null;
  }

  const hasValidBranchId = branch.branchId.trim().length > 0;

  const countryOptions = [
    { label: 'Select country', value: '' },
    ...(countriesQuery.data ?? []).map((c) => ({
      label: c.country_name,
      value: String(c.country_id),
    })),
  ];

  const stateOptions = [
    { label: 'Select state', value: '' },
    ...(statesQuery.data ?? []).map((s) => ({
      label: s.state_name,
      value: String(s.state_id),
    })),
  ];

  return (
    <>
      <p className="mb-6 text-sm text-slate-600">
        Add the address for {company.companyName} / {branch.branchName}.
      </p>

      <div className="mb-6 space-y-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Company ID
          </p>
          <p className="mt-1 font-mono text-sm text-slate-800">
            {company.companyId}
          </p>
        </div>
        <div className="border-t border-slate-200 pt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Branch ID
          </p>
          <p className="mt-1 font-mono text-sm text-slate-800">
            {branch.branchId}
          </p>
        </div>
      </div>

      <Form
        schema={addressSchema}
        onSubmit={(values: AddressFormInput) => {
          if (!hasValidBranchId) {
            addNotification({
              type: 'error',
              title: 'Branch required',
              message:
                'Register the branch with the backend first, then add an address.',
            });
            return;
          }

          registerAddress.mutate(
            {
              branchId: branch.branchId,
              countryId: values.countryId,
              stateId: values.stateId,
              city: values.city,
              area: values.area,
              locality: values.locality || undefined,
              landmark: values.landmark || undefined,
              street: values.street || undefined,
              postalCode: values.postalCode,
              latitude: values.latitude || undefined,
              longitude: values.longitude || undefined,
            },
            {
              onSuccess: (address) => {
                completeSetupStep('address', {
                  companyAddress: {
                    addressId: String(address.address_id),
                    companyId: company.companyId,
                    branchId: branch.branchId,
                    countryId: values.countryId,
                    stateId: values.stateId,
                    city: values.city,
                    area: values.area,
                    locality: values.locality,
                    landmark: values.landmark,
                    street: values.street,
                    postalCode: values.postalCode,
                    latitude: values.latitude,
                    longitude: values.longitude,
                  },
                });

                resetRef.current?.(emptyAddress);
                setSelectedCountryId('');

                addNotification({
                  type: 'success',
                  title: 'Address registered',
                  message: 'Company address saved successfully.',
                });

                onSuccess();
              },
            },
          );
        }}
        options={{
          defaultValues: emptyAddress,
        }}
      >
        {({ register, formState, reset, setValue }) => {
          resetRef.current = reset;
          const countryField = register('countryId');

          return (
            <div className="space-y-4">
              <Select
                label="Country"
                error={formState.errors['countryId']}
                registration={{
                  ...countryField,
                  onChange: async (e) => {
                    const result = await countryField.onChange(e);
                    const next = e.target.value;
                    setSelectedCountryId(next);
                    setValue('stateId', '');
                    return result;
                  },
                }}
                options={countryOptions}
                disabled={countriesQuery.isLoading}
              />
              {countriesQuery.isLoading ? (
                <p className="-mt-2 text-xs text-slate-500">Loading countries…</p>
              ) : countriesQuery.isError ? (
                <p className="-mt-2 text-xs text-red-600">
                  Could not load countries. Check that FastAPI is running on port
                  8000.
                </p>
              ) : (countriesQuery.data?.length ?? 0) === 0 ? (
                <p className="-mt-2 text-xs text-red-600">
                  No countries returned from GET /v1/countries.
                </p>
              ) : null}
              <Select
                label="State"
                error={formState.errors['stateId']}
                registration={register('stateId')}
                options={stateOptions}
                disabled={!selectedCountryId || statesQuery.isLoading}
              />
              <Input
                label="City"
                error={formState.errors['city']}
                registration={register('city')}
              />
              <Input
                label="Area"
                error={formState.errors['area']}
                registration={register('area')}
              />
              <Input
                label="Locality"
                error={formState.errors['locality']}
                registration={register('locality')}
              />
              <Input
                label="Landmark"
                error={formState.errors['landmark']}
                registration={register('landmark')}
              />
              <Input
                label="Street"
                error={formState.errors['street']}
                registration={register('street')}
              />
              <Input
                label="Postal Code"
                error={formState.errors['postalCode']}
                registration={register('postalCode')}
              />
              <Input
                label="Latitude"
                error={formState.errors['latitude']}
                registration={register('latitude')}
                placeholder="Optional"
              />
              <Input
                label="Longitude"
                error={formState.errors['longitude']}
                registration={register('longitude')}
                placeholder="Optional"
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onBack}>
                  Back
                </Button>
                <Button type="submit" isLoading={registerAddress.isPending}>
                  Continue
                </Button>
              </div>
            </div>
          );
        }}
      </Form>
    </>
  );
};
