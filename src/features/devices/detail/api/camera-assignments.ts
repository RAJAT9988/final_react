import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig, QueryConfig } from '@/lib/react-query';
import {
  CameraDto,
  DeviceCameraAssignmentCreatePayload,
  DeviceCameraAssignmentDto,
} from '@/types/api';

const unwrapList = (
  response:
    | DeviceCameraAssignmentDto[]
    | { data?: DeviceCameraAssignmentDto[] },
) => (Array.isArray(response) ? response : (response.data ?? []));

export type AssignmentCameraOption = {
  id: string;
  name: string;
};

export const getCamerasForAssignment = async (): Promise<
  AssignmentCameraOption[]
> => {
  const response = await api.get<unknown, CameraDto[] | { data?: CameraDto[] }>(
    '/v1/cameras',
  );
  const list = Array.isArray(response) ? response : (response.data ?? []);
  return list.map((camera) => ({
    id: String(camera.camera_id),
    name: camera.camera_name,
  }));
};

export const getCameraAssignments = async (
  deviceId: string,
): Promise<DeviceCameraAssignmentDto[]> => {
  const response = await api.get<
    unknown,
    DeviceCameraAssignmentDto[] | { data?: DeviceCameraAssignmentDto[] }
  >(`/v1/devices/${deviceId}/camera-assignments`);
  return unwrapList(response);
};

export const createCameraAssignment = async ({
  deviceId,
  data,
}: {
  deviceId: string;
  data: DeviceCameraAssignmentCreatePayload;
}): Promise<DeviceCameraAssignmentDto> => {
  return api.post(`/v1/devices/${deviceId}/camera-assignments`, data);
};

export const updateCameraAssignment = async ({
  assignmentId,
  data,
}: {
  assignmentId: string;
  data: { status?: string; confidence_threshold?: number };
}): Promise<DeviceCameraAssignmentDto> => {
  return api.patch(`/v1/camera-assignments/${assignmentId}`, data);
};

export const deleteCameraAssignment = async (
  assignmentId: string,
): Promise<void> => {
  await api.delete(`/v1/camera-assignments/${assignmentId}`);
};

export const getCameraAssignmentsQueryOptions = (deviceId: string) =>
  queryOptions({
    queryKey: ['devices', 'assignments', deviceId],
    queryFn: () => getCameraAssignments(deviceId),
    enabled: Boolean(deviceId),
  });

export const useCamerasForAssignment = () => {
  return useQuery({
    queryKey: ['devices', 'assignment-cameras'],
    queryFn: getCamerasForAssignment,
  });
};

export const useCameraAssignments = ({
  deviceId,
  queryConfig,
}: {
  deviceId: string;
  queryConfig?: QueryConfig<typeof getCameraAssignmentsQueryOptions>;
}) => {
  return useQuery({
    ...getCameraAssignmentsQueryOptions(deviceId),
    ...queryConfig,
  });
};

export const useCreateCameraAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCameraAssignment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['devices', 'assignments'] });
    },
  });
};

export const useUpdateCameraAssignment = (
  options: { mutationConfig?: MutationConfig<typeof updateCameraAssignment> } = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options.mutationConfig,
    mutationFn: updateCameraAssignment,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['devices', 'assignments'] });
      options.mutationConfig?.onSuccess?.(...args);
    },
  });
};

export const useDeleteCameraAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCameraAssignment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['devices', 'assignments'] });
    },
  });
};
