/**
 * Device detail — Open Device from Adopted list.
 * URL: /app/devices/:deviceId
 */

import { Navigate, useParams } from 'react-router';

import { Head } from '@/components/seo';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useDevice } from '@/features/devices/adopted/api/get-device';
import { DeviceDetailPage } from '@/features/devices/detail/components/device-detail-page';

const DeviceDetailRoute = () => {
  const { deviceId = '' } = useParams();
  const deviceQuery = useDevice({ deviceId });

  if (!deviceId) return <Navigate to={paths.app.devices.getHref()} replace />;

  if (deviceQuery.isError) {
    return <Navigate to={paths.app.devices.getHref()} replace />;
  }

  if (deviceQuery.isLoading || !deviceQuery.data) {
    return (
      <div className="flex justify-center px-6 py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Head title={`${deviceQuery.data.name} — Device`} />
      <DeviceDetailPage device={deviceQuery.data} />
    </>
  );
};

export default DeviceDetailRoute;
