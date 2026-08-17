/**
 * Cameras page — post-setup app.
 * URL: /app/cameras
 */

import { Head } from '@/components/seo';
import { CamerasPage } from '@/features/cameras/components/cameras-page';

const CamerasRoute = () => {
  return (
    <>
      <Head title="Cameras" />
      <CamerasPage />
    </>
  );
};

export default CamerasRoute;
