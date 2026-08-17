import { HttpResponse, http, passthrough } from 'msw';

import { devicesStore, type MockAdoptedDevice } from '../devices-store';
import { networkDelay } from '../utils';

type AddDeviceBody = {
  device_name: string;
  ip: string;
  device_role?: MockAdoptedDevice['device_role'];
  serial_no?: string;
  mac_id?: string;
  manufacturing_date?: string;
  company_id?: string;
  branch_id?: string;
};

const api = (path: string) => `*${path}`;

export const devicesHandlers = [
  http.get(api('/v1/devices/current'), async () => {
    // In the browser, let the machine serving this page report its real IP.
    if (
      typeof window !== 'undefined' &&
      Boolean(window.navigator?.serviceWorker)
    ) {
      return passthrough();
    }

    await networkDelay();
    const device = devicesStore.getCurrent();
    return HttpResponse.json({
      code: 200,
      message: null,
      data: {
        device_id: device.device_id,
        device_name: device.device_name,
        ip: device.ip,
        device_role: device.device_role,
        status: device.status,
        serial_no: device.serial_no,
        mac_id: device.mac_id,
      },
    });
  }),

  http.get(api('/v1/devices'), async () => {
    await networkDelay();
    return HttpResponse.json(
      devicesStore.listAdopted().map((device) => ({
        device_id: device.device_id,
        device_name: device.device_name,
        ip: device.ip,
        dns_name: null,
        device_role: device.device_role,
        status: device.status,
        serial_no: device.serial_no,
        mac_id: device.mac_id,
        manufacturing_date: device.manufacturing_date || null,
        is_deleted: device.is_deleted,
        created_at: device.created_at,
        updated_at: device.updated_at,
        current_assignment: {
          company_device_id: '00000000-0000-0000-0000-000000000001',
          device_id: device.device_id,
          company_id: device.company_id || null,
          branch_id: device.branch_id || null,
          approval_status: 'approved',
          is_deleted: false,
          created_at: device.created_at,
          updated_at: device.updated_at,
        },
      })),
    );
  }),

  http.get(api('/v1/devices/:deviceId'), async ({ params }) => {
    await networkDelay();
    const device = devicesStore.getAdoptedById(String(params.deviceId));
    if (!device) {
      return HttpResponse.json({ detail: 'Device not found' }, { status: 404 });
    }
    return HttpResponse.json({
      device_id: device.device_id,
      device_name: device.device_name,
      ip: device.ip,
      dns_name: null,
      device_role: device.device_role,
      status: device.status,
      serial_no: device.serial_no,
      mac_id: device.mac_id,
      manufacturing_date: device.manufacturing_date || null,
      is_deleted: device.is_deleted,
      created_at: device.created_at,
      updated_at: device.updated_at,
      current_assignment: {
        company_device_id: '00000000-0000-0000-0000-000000000001',
        device_id: device.device_id,
        company_id: device.company_id || null,
        branch_id: device.branch_id || null,
        approval_status: 'approved',
        is_deleted: false,
        created_at: device.created_at,
        updated_at: device.updated_at,
      },
    });
  }),

  http.post(api('/v1/devices'), async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as AddDeviceBody;
    if (
      !body.device_name?.trim() ||
      !body.ip?.trim() ||
      !body.serial_no?.trim() ||
      !body.mac_id?.trim() ||
      !body.branch_id?.trim()
    ) {
      return HttpResponse.json(
        { detail: 'device_name, ip, serial_no, mac_id, and branch_id are required' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const device: MockAdoptedDevice = {
      device_id: crypto.randomUUID(),
      company_id: body.company_id?.trim() || 'company-1',
      branch_id: body.branch_id.trim(),
      device_name: body.device_name.trim(),
      ip: body.ip.trim(),
      device_role: body.device_role ?? 'slave',
      status: 'Inactive',
      serial_no: body.serial_no.trim(),
      mac_id: body.mac_id.trim(),
      manufacturing_date: body.manufacturing_date?.trim() || '',
      created_at: now,
      created_by: 'admin',
      updated_at: now,
      updated_by: 'admin',
      is_system_record: false,
      is_deleted: false,
    };

    devicesStore.addAdopted(device);

    return HttpResponse.json(
      {
        device_id: device.device_id,
        device_name: device.device_name,
        ip: device.ip,
        dns_name: null,
        device_role: device.device_role,
        status: device.status,
        serial_no: device.serial_no,
        mac_id: device.mac_id,
        manufacturing_date: device.manufacturing_date || null,
        is_deleted: false,
        created_at: device.created_at,
        updated_at: device.updated_at,
        current_assignment: {
          company_device_id: crypto.randomUUID(),
          device_id: device.device_id,
          company_id: device.company_id || null,
          branch_id: device.branch_id || null,
          approval_status: 'pending_approval',
          is_deleted: false,
          created_at: device.created_at,
          updated_at: device.updated_at,
        },
      },
      { status: 201 },
    );
  }),

  http.get(api('/api/v1/devices'), async () => {
    await networkDelay();
    return HttpResponse.json({
      code: 200,
      message: null,
      data: devicesStore.listAdopted(),
    });
  }),

  http.post(api('/api/v1/devices/discover/scan'), async () => {
    await networkDelay();
    return HttpResponse.json({
      code: 200,
      message: null,
      data: {
        ip_range: '192.168.1.1 – 255',
        devices: devicesStore.listDiscovered(),
      },
    });
  }),

  http.get(api('/api/v1/devices/:deviceId/health'), async ({ params }) => {
    await networkDelay();
    const deviceId = String(params.deviceId);
    const device = devicesStore.getAdoptedById(deviceId);
    if (!device) {
      return HttpResponse.json(
        { code: 404, message: 'Device not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      code: 200,
      message: null,
      data: devicesStore.getHealth(deviceId),
    });
  }),

  http.get(api('/api/v1/devices/:deviceId'), async ({ params }) => {
    await networkDelay();
    const device = devicesStore.getAdoptedById(String(params.deviceId));
    if (!device) {
      return HttpResponse.json(
        { code: 404, message: 'Device not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      code: 200,
      message: null,
      data: device,
    });
  }),

  http.post(api('/api/v1/devices'), async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as AddDeviceBody;

    if (!body.device_name?.trim() || !body.ip?.trim()) {
      return HttpResponse.json(
        { code: 400, message: 'Device name and IP are required' },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();
    const device: MockAdoptedDevice = {
      device_id: crypto.randomUUID(),
      company_id: body.company_id?.trim() || 'company-1',
      branch_id: body.branch_id?.trim() || 'branch-1',
      device_name: body.device_name.trim(),
      ip: body.ip.trim(),
      device_role: body.device_role ?? 'standalone',
      status: 'Active',
      serial_no: body.serial_no?.trim() || '—',
      mac_id: body.mac_id?.trim() || '—',
      manufacturing_date: body.manufacturing_date?.trim() || '',
      created_at: now,
      created_by: 'admin',
      updated_at: now,
      updated_by: 'admin',
      is_system_record: false,
      is_deleted: false,
    };

    devicesStore.addAdopted(device);

    return HttpResponse.json({
      code: 200,
      message: null,
      data: device,
    });
  }),
];
