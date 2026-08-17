import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import {
  useBranches,
  useDeleteBranch,
  useUpdateBranch,
} from '@/features/company-branch/api/manage-branch';
import { useRegisterBranch } from '@/features/company-branch/api/register-branch';

type BranchSettingsProps = {
  companyId: string;
};

export const BranchSettings = ({ companyId }: BranchSettingsProps) => {
  const { addNotification } = useNotifications();
  const branchesQuery = useBranches(companyId);
  const updateBranch = useUpdateBranch();
  const deleteBranch = useDeleteBranch();
  const addBranch = useRegisterBranch();

  return (
    <div className="space-y-5">
      <form
        className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const value = (name: string) =>
            (form.elements.namedItem(name) as HTMLInputElement).value;
          addBranch.mutate(
            {
              companyId,
              branchName: value('branchName'),
              branchContactPersonName: value('branchContactPersonName'),
              branchContactPersonEmail: value('branchContactPersonEmail'),
              branchContactPersonPhone: value('branchContactPersonPhone'),
              branchContactPersonDesignation: value(
                'branchContactPersonDesignation',
              ),
            },
            {
              onSuccess: () => {
                form.reset();
                addNotification({
                  type: 'success',
                  title: 'Branch added',
                  message: 'The branch was created.',
                });
              },
            },
          );
        }}
      >
        <h2 className="text-sm font-semibold text-slate-900">Add branch</h2>
        <input
          name="branchName"
          placeholder="Branch name"
          className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            name="branchContactPersonName"
            placeholder="Contact name"
            className="h-9 rounded-md border border-slate-200 px-3 text-sm"
          />
          <input
            name="branchContactPersonEmail"
            type="email"
            placeholder="Contact email"
            className="h-9 rounded-md border border-slate-200 px-3 text-sm"
          />
          <input
            name="branchContactPersonPhone"
            placeholder="Contact phone"
            className="h-9 rounded-md border border-slate-200 px-3 text-sm"
          />
          <input
            name="branchContactPersonDesignation"
            placeholder="Contact designation"
            className="h-9 rounded-md border border-slate-200 px-3 text-sm"
          />
        </div>
        <Button type="submit" size="sm" isLoading={addBranch.isPending}>
          Add branch
        </Button>
      </form>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Branches</h2>
        <ul className="mt-3 space-y-4">
          {(branchesQuery.data ?? []).map((branch) => (
            <li
              key={branch.branch_id}
              className="rounded-lg border border-slate-100 p-3"
            >
              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const value = (name: string) =>
                    (form.elements.namedItem(name) as HTMLInputElement).value;
                  updateBranch.mutate({
                    branchId: branch.branch_id,
                    data: {
                      branch_name: value('branch_name'),
                      branch_contact_person_name: value(
                        'branch_contact_person_name',
                      ),
                      branch_contact_person_email: value(
                        'branch_contact_person_email',
                      ),
                      branch_contact_person_mobile_no: value(
                        'branch_contact_person_mobile_no',
                      ),
                      branch_contact_person_designation: value(
                        'branch_contact_person_designation',
                      ),
                    },
                  });
                }}
              >
                <input
                  name="branch_name"
                  defaultValue={branch.branch_name}
                  className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
                />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    name="branch_contact_person_name"
                    defaultValue={branch.branch_contact_person_name ?? ''}
                    placeholder="Contact name"
                    className="h-9 rounded-md border border-slate-200 px-3 text-sm"
                  />
                  <input
                    name="branch_contact_person_email"
                    defaultValue={branch.branch_contact_person_email ?? ''}
                    placeholder="Contact email"
                    className="h-9 rounded-md border border-slate-200 px-3 text-sm"
                  />
                  <input
                    name="branch_contact_person_mobile_no"
                    defaultValue={branch.branch_contact_person_mobile_no ?? ''}
                    placeholder="Contact phone"
                    className="h-9 rounded-md border border-slate-200 px-3 text-sm"
                  />
                  <input
                    name="branch_contact_person_designation"
                    defaultValue={
                      branch.branch_contact_person_designation ?? ''
                    }
                    placeholder="Contact designation"
                    className="h-9 rounded-md border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" size="sm" variant="outline">
                    Save
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (!window.confirm(`Delete ${branch.branch_name}?`)) {
                        return;
                      }
                      deleteBranch.mutate(branch.branch_id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
