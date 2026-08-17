/**
 * Camera live view — Open Camera from Adopted list.
 * URL: /app/cameras/:cameraId
 */

import { Navigate, useParams } from 'react-router';

import { Head } from '@/components/seo';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useCamera } from '@/features/cameras/adopted/api/get-camera';
import { CameraLivePage } from '@/features/cameras/live/components/camera-live-page';

const CameraLiveRoute = () => {
  const { cameraId = '' } = useParams();
  const cameraQuery = useCamera({ cameraId });

  if (!cameraId) return <Navigate to={paths.app.cameras.getHref()} replace />;

  if (cameraQuery.isError) {
    return <Navigate to={paths.app.cameras.getHref()} replace />;
  }

  if (cameraQuery.isLoading || !cameraQuery.data) {
    return (
      <div className="flex justify-center px-6 py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <Head title={`${cameraQuery.data.name} — Live`} />
      <CameraLivePage camera={cameraQuery.data} />
    </>
  );
};

export default CameraLiveRoute;
