import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api-client';
import { MutationConfig, QueryConfig } from '@/lib/react-query';
import {
  DeviceModelSubscriptionCreatePayload,
  DeviceModelSubscriptionDto,
} from '@/types/api';

const unwrapList = (
  response: DeviceModelSubscriptionDto[] | { data?: DeviceModelSubscriptionDto[] },
) => (Array.isArray(response) ? response : (response.data ?? []));

export const getModelSubscriptions = async (
  deviceId: string,
): Promise<DeviceModelSubscriptionDto[]> => {
  const response = await api.get<
    unknown,
    DeviceModelSubscriptionDto[] | { data?: DeviceModelSubscriptionDto[] }
  >(`/v1/devices/${deviceId}/model-subscriptions`);
  return unwrapList(response);
};

export const createModelSubscription = async ({
  deviceId,
  data,
}: {
  deviceId: string;
  data: DeviceModelSubscriptionCreatePayload;
}): Promise<DeviceModelSubscriptionDto> => {
  return api.post(`/v1/devices/${deviceId}/model-subscriptions`, data);
};

export const updateModelSubscription = async ({
  subscriptionId,
  data,
}: {
  subscriptionId: string;
  data: { is_enabled?: boolean; end_date?: string | null };
}): Promise<DeviceModelSubscriptionDto> => {
  return api.patch(`/v1/model-subscriptions/${subscriptionId}`, data);
};

export const getModelSubscriptionsQueryOptions = (deviceId: string) =>
  queryOptions({
    queryKey: ['devices', 'subscriptions', deviceId],
    queryFn: () => getModelSubscriptions(deviceId),
    enabled: Boolean(deviceId),
  });

export const useModelSubscriptions = ({
  deviceId,
  queryConfig,
}: {
  deviceId: string;
  queryConfig?: QueryConfig<typeof getModelSubscriptionsQueryOptions>;
}) => {
  return useQuery({
    ...getModelSubscriptionsQueryOptions(deviceId),
    ...queryConfig,
  });
};

export const useCreateModelSubscription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createModelSubscription,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['devices', 'subscriptions'] });
    },
  });
};

export const useUpdateModelSubscription = (
  options: { mutationConfig?: MutationConfig<typeof updateModelSubscription> } = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options.mutationConfig,
    mutationFn: updateModelSubscription,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['devices', 'subscriptions'] });
      options.mutationConfig?.onSuccess?.(...args);
    },
  });
};
