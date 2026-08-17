/**
 * Adopted cameras — GET /v1/cameras
 */

import { queryOptions, useQuery } from '@tanstack/react-query';

import type { AdoptedCamera } from '@/features/cameras/adopted/components/adopted-cameras';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { CameraDto } from '@/types/api';

const unwrapList = (
  response: CameraDto[] | { data?: CameraDto[] },
): CameraDto[] => (Array.isArray(response) ? response : response.data ?? []);

const unwrapOne = (
  response: CameraDto | { data?: CameraDto },
): CameraDto | undefined =>
  response && typeof response === 'object' && 'camera_id' in response
    ? (response as CameraDto)
    : (response as { data?: CameraDto }).data;

const toUiStatus = (status: string): AdoptedCamera['status'] => {
  const value = status.toLowerCase();
  if (value === 'online') return 'Online';
  if (value === 'disconnected') return 'Error';
  return 'Connecting';
};

const formatLastSeen = (value?: string): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

export const mapCameraDto = (dto: CameraDto): AdoptedCamera => ({
  id: String(dto.camera_id),
  name: dto.camera_name,
  status: toUiStatus(dto.camera_status),
  cameraStatus: dto.camera_status,
  companyDeviceId: String(dto.company_device_id),
  cameraType: dto.camera_type || 'RTSP',
  manufacturer: dto.camera_type || '—',
  model: dto.resolution?.trim() || '—',
  room: dto.location?.trim() || dto.zone?.trim() || '—',
  location: dto.location?.trim() || '',
  zone: dto.zone?.trim() || '',
  department: dto.department?.trim() || '',
  cameraGroup: dto.camera_group?.trim() || '',
  provider: dto.camera_type || 'RTSP',
  lastSeen: formatLastSeen(dto.updated_at),
  rtspUrl: dto.rtsp_url,
  errorMessage:
    dto.camera_status?.toLowerCase() === 'disconnected'
      ? 'Camera disconnected'
      : undefined,
});

export const getAdoptedCameras = async (
  companyDeviceId?: string,
): Promise<AdoptedCamera[]> => {
  const response = companyDeviceId
    ? await api.get<unknown, CameraDto[] | { data?: CameraDto[] }>(
        `/v1/devices/${companyDeviceId}/cameras`,
      )
    : await api.get<unknown, CameraDto[] | { data?: CameraDto[] }>(
        '/v1/cameras',
      );

  return unwrapList(response).map(mapCameraDto);
};

export const parseCameraResponse = (
  response: CameraDto | { data?: CameraDto },
): AdoptedCamera => {
  const dto = unwrapOne(response);
  if (!dto?.camera_id) {
    throw new Error('Camera not found');
  }
  return mapCameraDto(dto);
};

export const getAdoptedCamerasQueryOptions = (companyDeviceId?: string) =>
  queryOptions({
    queryKey: ['cameras', 'adopted', companyDeviceId ?? 'none'],
    queryFn: () => getAdoptedCameras(companyDeviceId),
  });

type UseAdoptedCamerasOptions = {
  companyDeviceId?: string;
  queryConfig?: QueryConfig<typeof getAdoptedCamerasQueryOptions>;
};

export const useAdoptedCameras = ({
  companyDeviceId,
  queryConfig,
}: UseAdoptedCamerasOptions = {}) => {
  return useQuery({
    ...getAdoptedCamerasQueryOptions(companyDeviceId),
    ...queryConfig,
  });
};
