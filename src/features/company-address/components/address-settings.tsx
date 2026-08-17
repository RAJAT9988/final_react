import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { useCountries } from '@/features/company-address/api/get-countries';
import { useStatesByCountry } from '@/features/company-address/api/get-states';
import {
  useAddress,
  useDeleteAddress,
  useUpdateAddress,
} from '@/features/company-address/api/manage-address';

type AddressSettingsProps = {
  addressId: string;
};

export const AddressSettings = ({ addressId }: AddressSettingsProps) => {
  const addressQuery = useAddress(addressId);
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();
  const countriesQuery = useCountries();
  const address = addressQuery.data;
  const [countryId, setCountryId] = useState('');
  const statesQuery = useStatesByCountry({ countryId });

  useEffect(() => {
    if (address?.country_id) setCountryId(String(address.country_id));
  }, [address?.country_id]);

  if (!addressId) {
    return (
      <p className="text-sm text-slate-500">
        No address is saved yet. Finish the setup address step first.
      </p>
    );
  }

  if (addressQuery.isLoading) return <Spinner />;
  if (!address) {
    return <p className="text-sm text-slate-500">Address not found.</p>;
  }

  return (
    <form
      className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const value = (name: string) =>
          (form.elements.namedItem(name) as HTMLInputElement).value;
        const latitude = value('latitude');
        const longitude = value('longitude');
        updateAddress.mutate({
          addressId,
          data: {
            country_id: countryId,
            state_id: value('state_id'),
            city: value('city'),
            area: value('area'),
            locality: value('locality'),
            landmark: value('landmark'),
            street: value('street'),
            postal_code: value('postal_code'),
            latitude: latitude ? Number(latitude) : null,
            longitude: longitude ? Number(longitude) : null,
          },
        });
      }}
    >
      <h2 className="text-sm font-semibold text-slate-900">Address</h2>
      <select
        name="country_id"
        value={countryId}
        onChange={(e) => setCountryId(e.target.value)}
        className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
      >
        {(countriesQuery.data ?? []).map((country) => (
          <option key={country.country_id} value={country.country_id}>
            {country.country_name}
          </option>
        ))}
      </select>
      <select
        name="state_id"
        defaultValue={String(address.state_id)}
        className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
      >
        {(statesQuery.data ?? []).map((state) => (
          <option key={state.state_id} value={state.state_id}>
            {state.state_name}
          </option>
        ))}
      </select>
      <input
        name="city"
        defaultValue={address.city}
        placeholder="City"
        className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
      />
      <input
        name="area"
        defaultValue={address.area ?? ''}
        placeholder="Area"
        className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
      />
      <input
        name="locality"
        defaultValue={address.locality ?? ''}
        placeholder="Locality"
        className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
      />
      <input
        name="landmark"
        defaultValue={address.landmark ?? ''}
        placeholder="Landmark"
        className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
      />
      <input
        name="street"
        defaultValue={address.street ?? ''}
        placeholder="Street"
        className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
      />
      <input
        name="postal_code"
        defaultValue={address.postal_code ?? ''}
        placeholder="Postal code"
        className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          name="latitude"
          defaultValue={address.latitude ?? ''}
          placeholder="Latitude"
          className="h-9 rounded-md border border-slate-200 px-3 text-sm"
        />
        <input
          name="longitude"
          defaultValue={address.longitude ?? ''}
          placeholder="Longitude"
          className="h-9 rounded-md border border-slate-200 px-3 text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" isLoading={updateAddress.isPending}>
          Save address
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          isLoading={deleteAddress.isPending}
          onClick={() => {
            if (!window.confirm('Delete this address?')) return;
            deleteAddress.mutate(addressId);
          }}
        >
          Delete address
        </Button>
      </div>
    </form>
  );
};
