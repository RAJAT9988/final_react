/**
 * Devices page — post-setup app.
 * URL: /app/devices
 */

import { Head } from '@/components/seo';
import { DevicesPage } from '@/features/devices/components/devices-page';

const DevicesRoute = () => {
  return (
    <>
      <Head title="Devices" />
      <DevicesPage />
    </>
  );
};

export default DevicesRoute;
