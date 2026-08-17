import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { Spinner } from '@/components/ui/spinner';
import {
  useCompanies,
  useCompany,
  useDeleteCompany,
  useUpdateCompany,
} from '@/features/company/api/manage-company';

type CompanySettingsProps = {
  companyId: string;
};

export const CompanySettings = ({ companyId }: CompanySettingsProps) => {
  const { addNotification } = useNotifications();
  const companyQuery = useCompany(companyId);
  const companiesQuery = useCompanies();
  const updateCompany = useUpdateCompany();
  const deleteCompany = useDeleteCompany();
  const company = companyQuery.data;

  if (companyQuery.isLoading) return <Spinner />;
  if (!company) {
    return <p className="text-sm text-slate-500">No company found.</p>;
  }

  return (
    <div className="space-y-5">
      {(companiesQuery.data ?? []).length > 1 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Companies</h2>
          <ul className="mt-3 space-y-1 text-sm text-slate-700">
            {(companiesQuery.data ?? []).map((item) => (
              <li key={item.company_id}>
                {item.company_name}
                {item.company_id === companyId ? ' (current)' : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <form
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const value = (name: string) =>
            (form.elements.namedItem(name) as HTMLInputElement).value;
          updateCompany.mutate(
            {
              companyId,
              data: {
                company_name: value('company_name'),
                company_description: value('company_description'),
                contact_person_name: value('contact_person_name'),
                contact_person_email: value('contact_person_email'),
                contact_person_mobile_no: value('contact_person_mobile_no'),
                contact_person_designation: value('contact_person_designation'),
              },
            },
            {
              onSuccess: () =>
                addNotification({
                  type: 'success',
                  title: 'Company updated',
                  message: 'Company details were saved.',
                }),
            },
          );
        }}
      >
        <label className="block text-sm">
          <span className="mb-1 block text-slate-700">Company name</span>
          <input
            name="company_name"
            defaultValue={company.company_name}
            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-700">Description</span>
          <input
            name="company_description"
            defaultValue={company.company_description ?? ''}
            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-700">Contact name</span>
          <input
            name="contact_person_name"
            defaultValue={company.contact_person_name ?? ''}
            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-700">Contact email</span>
          <input
            name="contact_person_email"
            type="email"
            defaultValue={company.contact_person_email ?? ''}
            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-700">Contact mobile</span>
          <input
            name="contact_person_mobile_no"
            defaultValue={company.contact_person_mobile_no ?? ''}
            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-slate-700">Contact designation</span>
          <input
            name="contact_person_designation"
            defaultValue={company.contact_person_designation ?? ''}
            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
          />
        </label>
        <Button type="submit" isLoading={updateCompany.isPending}>
          Save company
        </Button>
      </form>

      <Button
        type="button"
        variant="destructive"
        isLoading={deleteCompany.isPending}
        onClick={() => {
          const typed = window.prompt(
            `Type ${company.company_name} to delete this company.`,
          );
          if (typed !== company.company_name) return;
          deleteCompany.mutate(companyId, {
            onSuccess: () =>
              addNotification({
                type: 'success',
                title: 'Company deleted',
                message: 'The company was removed.',
              }),
          });
        }}
      >
        Delete company
      </Button>
    </div>
  );
};
