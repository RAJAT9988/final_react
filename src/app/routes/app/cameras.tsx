/**
 * Cameras page — dashboard tab.
 *
 * URL: /app/cameras
 */

import { Head } from '@/components/seo';

const CamerasRoute = () => {
  return (
    <>
      <Head title="Cameras" />

      <div className="px-6 py-8 sm:px-8">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Cameras
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Camera content will go here.
        </p>
      </div>
    </>
  );
};

export default CamerasRoute;
