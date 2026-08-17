import { queryOptions, useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { CameraDto } from '@/types/api';

export type HomeCamera = {
  id: string;
  name: string;
  status: 'Online' | 'Connecting' | 'Error';
  room: string;
  snapshotLabel: string;
  latencyMs: number;
  lastSeen: string;
};

const unwrapList = (response: CameraDto[] | { data?: CameraDto[] }): CameraDto[] =>
  Array.isArray(response) ? response : (response.data ?? []);

const toUiStatus = (status: string): HomeCamera['status'] => {
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

const toHomeCamera = (dto: CameraDto): HomeCamera => {
  const room = dto.location?.trim() || dto.zone?.trim() || '—';
  return {
    id: String(dto.camera_id),
    name: dto.camera_name,
    status: toUiStatus(dto.camera_status),
    room,
    snapshotLabel: room,
    latencyMs: 0,
    lastSeen: formatLastSeen(dto.updated_at),
  };
};

export const getHomeCameras = async (): Promise<HomeCamera[]> => {
  const response = await api.get<unknown, CameraDto[] | { data?: CameraDto[] }>(
    '/v1/cameras',
  );

  return unwrapList(response).map(toHomeCamera);
};

export const getHomeCamerasQueryOptions = () =>
  queryOptions({
    queryKey: ['home', 'cameras'],
    queryFn: getHomeCameras,
  });

type UseHomeCamerasOptions = {
  queryConfig?: QueryConfig<typeof getHomeCamerasQueryOptions>;
};

export const useHomeCameras = ({ queryConfig }: UseHomeCamerasOptions = {}) => {
  return useQuery({
    ...getHomeCamerasQueryOptions(),
    ...queryConfig,
  });
};
