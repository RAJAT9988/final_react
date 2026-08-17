/**
 * Add device — POST /v1/devices
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { registerSlave } from '@/features/devices/add/api/register-slave';
import type { AddDeviceInput } from '@/features/devices/add/components/add-device-form';
import {
  getAdoptedDevices,
  mapDeviceDto,
  unwrapDevice,
} from '@/features/devices/adopted/api/get-adopted-devices';
import { getDevice } from '@/features/devices/adopted/api/get-device';
import { updateDevice } from '@/features/devices/adopted/api/update-device';
import type { AdoptedDevice } from '@/features/devices/adopted/components/adopted-devices';
import { api } from '@/lib/api-client';
import { MutationConfig } from '@/lib/react-query';
import { DeviceCreatePayload, DeviceDto } from '@/types/api';

const SETUP_STORAGE_KEY = 'bp-setup';

const getBranchIdFromSetup = (): string | undefined => {
  try {
    const raw = localStorage.getItem(SETUP_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as {
      companyBranch?: { branchId?: string };
    };
    return parsed.companyBranch?.branchId?.trim() || undefined;
  } catch {
    return undefined;
  }
};

const getBranchId = async (): Promise<string> => {
  const devices = await getAdoptedDevices();
  const fromDevice = devices.find((device) => device.branchId)?.branchId;
  const branchId = fromDevice || getBranchIdFromSetup();

  if (!branchId) {
    throw new Error(
      'No branch found. Finish company and branch setup before adding a device.',
    );
  }

  return branchId;
};

const toCreatePayload = async (
  data: AddDeviceInput,
): Promise<DeviceCreatePayload> => {
  const serialNo = data.serialNo?.trim();
  const macId = data.macId?.trim();

  if (!serialNo || !macId) {
    throw new Error('Serial no. and MAC ID are required.');
  }

  return {
    device_name: data.deviceName.trim(),
    ip: data.ip.trim(),
    dns_name: data.dnsName?.trim() || null,
    serial_no: serialNo,
    mac_id: macId,
    manufacturing_date: data.manufacturingDate?.trim() || null,
    branch_id: await getBranchId(),
  };
};

export const addDevice = async (
  data: AddDeviceInput,
): Promise<AdoptedDevice> => {
  if (data.deviceRole === 'slave') {
    const registered = await registerSlave({
      name: data.deviceName,
      ip: data.ip,
      macId: data.macId,
      serialNo: data.serialNo,
      dnsName: data.dnsName,
    });
    const deviceId = String(registered.device_id ?? '');
    if (!deviceId) {
      throw new Error('Slave registration failed');
    }
    return getDevice(deviceId);
  }

  const device = await api.post<
    DeviceCreatePayload,
    DeviceDto | { data?: DeviceDto }
  >('/v1/devices', await toCreatePayload(data));

  const dto = unwrapDevice(device);
  if (!dto?.device_id) {
    throw new Error('Failed to add device');
  }

  const created = mapDeviceDto(dto);
  if (data.deviceRole === created.deviceRole) {
    return created;
  }

  return updateDevice({
    deviceId: created.id,
    data: { device_role: data.deviceRole },
  });
};

type UseAddDeviceOptions = {
  mutationConfig?: MutationConfig<typeof addDevice>;
};

export const useAddDevice = ({ mutationConfig }: UseAddDeviceOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...mutationConfig,
    mutationFn: addDevice,
    onSuccess: (...args) => {
      void queryClient.invalidateQueries({ queryKey: ['devices'] });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
