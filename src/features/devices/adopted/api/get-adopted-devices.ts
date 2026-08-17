/**
 * Adopted devices — GET /v1/devices
 */

import { queryOptions, useQuery } from '@tanstack/react-query';

import type {
  AdoptedDevice,
  DeviceRole,
  DeviceStatus,
} from '@/features/devices/adopted/components/adopted-devices';
import { api } from '@/lib/api-client';
import { QueryConfig } from '@/lib/react-query';
import { DeviceDto } from '@/types/api';

export const unwrapDeviceList = (
  response: DeviceDto[] | { data?: DeviceDto[] },
): DeviceDto[] => (Array.isArray(response) ? response : (response.data ?? []));

export const unwrapDevice = (
  response: DeviceDto | { data?: DeviceDto },
): DeviceDto | undefined =>
  response && typeof response === 'object' && 'device_id' in response
    ? (response as DeviceDto)
    : (response as { data?: DeviceDto }).data;

const toDeviceRole = (value?: string): DeviceRole => {
  if (value === 'standalone' || value === 'master' || value === 'slave') {
    return value;
  }
  return 'slave';
};

const toDeviceStatus = (value?: string): DeviceStatus => {
  if (
    value === 'Active' ||
    value === 'Inactive' ||
    value === 'Maintenance' ||
    value === 'offline'
  ) {
    return value;
  }
  return 'Inactive';
};

export const mapDeviceDto = (dto: DeviceDto): AdoptedDevice => ({
  id: String(dto.device_id),
  companyId: dto.current_assignment?.company_id
    ? String(dto.current_assignment.company_id)
    : '',
  branchId: dto.current_assignment?.branch_id
    ? String(dto.current_assignment.branch_id)
    : '',
  companyDeviceId: dto.current_assignment?.company_device_id
    ? String(dto.current_assignment.company_device_id)
    : '',
  name: dto.device_name,
  ip: dto.ip,
  dnsName: dto.dns_name ?? '',
  deviceRole: toDeviceRole(dto.device_role),
  status: toDeviceStatus(dto.status),
  approvalStatus: dto.current_assignment?.approval_status ?? '',
  serialNo: dto.serial_no ?? '',
  macId: dto.mac_id ?? '',
  manufacturingDate: dto.manufacturing_date ?? '',
  createdAt: dto.created_at ?? '',
  createdBy: '—',
  updatedAt: dto.updated_at ?? '',
  updatedBy: '—',
  isSystemRecord: false,
  isDeleted: Boolean(dto.is_deleted),
});

export const getAdoptedDevices = async (): Promise<AdoptedDevice[]> => {
  const response = await api.get<unknown, DeviceDto[] | { data?: DeviceDto[] }>(
    '/v1/devices',
  );

  return unwrapDeviceList(response).map(mapDeviceDto);
};

export const getAdoptedDevicesQueryOptions = () =>
  queryOptions({
    queryKey: ['devices', 'adopted'],
    queryFn: getAdoptedDevices,
  });

type UseAdoptedDevicesOptions = {
  queryConfig?: QueryConfig<typeof getAdoptedDevicesQueryOptions>;
};

export const useAdoptedDevices = ({
  queryConfig,
}: UseAdoptedDevicesOptions = {}) => {
  return useQuery({
    ...getAdoptedDevicesQueryOptions(),
    ...queryConfig,
  });
};
