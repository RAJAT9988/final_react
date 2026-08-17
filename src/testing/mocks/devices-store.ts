import devicesSeed from './data/devices.json';

export type MockDeviceRole = 'standalone' | 'master' | 'slave';
export type MockDeviceStatus =
  | 'Active'
  | 'Inactive'
  | 'Maintenance'
  | 'offline';

export type MockAdoptedDevice = {
  device_id: string;
  company_id: string;
  branch_id: string;
  device_name: string;
  ip: string;
  device_role: MockDeviceRole;
  status: MockDeviceStatus;
  serial_no: string;
  mac_id: string;
  manufacturing_date: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  is_system_record: boolean;
  is_deleted: boolean;
};

export type MockDiscoveredDevice = {
  id: string;
  device_name: string;
  ip: string;
  device_role: MockDeviceRole;
  serial_no: string;
  mac_id: string;
  hidden: boolean;
};

export type MockDeviceHealth = {
  device_health_id: string;
  device_id: string;
  cpu_usage: number;
  npu_usage: number;
  ram: number;
  temperature: number;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  is_system_record: boolean;
  is_deleted: boolean;
};

const currentDevice = structuredClone(
  devicesSeed.current,
) as MockAdoptedDevice;

let adopted = structuredClone(devicesSeed.adopted) as MockAdoptedDevice[];
const discovered = structuredClone(
  devicesSeed.discovered,
) as MockDiscoveredDevice[];
const healthByDeviceId = structuredClone(
  devicesSeed.device_health,
) as Record<string, MockDeviceHealth>;

const defaultHealth = (deviceId: string): MockDeviceHealth => ({
  device_health_id: crypto.randomUUID(),
  device_id: deviceId,
  cpu_usage: 12,
  npu_usage: 5,
  ram: 40,
  temperature: 36,
  created_at: new Date().toISOString(),
  created_by: 'system',
  updated_at: new Date().toISOString(),
  updated_by: 'system',
  is_system_record: true,
  is_deleted: false,
});

export const devicesStore = {
  getCurrent: () => currentDevice,
  listAdopted: () => adopted.filter((device) => !device.is_deleted),
  getAdoptedById: (id: string) =>
    adopted.find((device) => device.device_id === id && !device.is_deleted),
  addAdopted: (device: MockAdoptedDevice) => {
    adopted = [...adopted, device];
    if (!healthByDeviceId[device.device_id]) {
      healthByDeviceId[device.device_id] = defaultHealth(device.device_id);
    }
    return device;
  },
  listDiscovered: () => discovered,
  getHealth: (deviceId: string) =>
    healthByDeviceId[deviceId] ?? defaultHealth(deviceId),
};
