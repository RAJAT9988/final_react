import { HttpResponse, http } from 'msw';

import { camerasStore, type MockAdoptedCamera } from '../cameras-store';
import { networkDelay } from '../utils';

type AddCameraBody = {
  name: string;
  room: string;
  manufacturer?: string;
  model?: string;
  provider?: string;
};

type ConnectBody = {
  device_id: string;
  username: string;
  password: string;
};

type CreateCameraBody = {
  camera_name?: string;
  company_device_id?: string;
  camera_type?: string;
  rtsp_url?: string | null;
  camera_status?: string;
  location?: string | null;
};

const toStatus = (status: MockAdoptedCamera['status']) => {
  if (status === 'Online') return 'online';
  if (status === 'Error') return 'disconnected';
  return 'offline';
};

const toCameraDto = (camera: MockAdoptedCamera) => ({
  camera_id: camera.id,
  camera_name: camera.name,
  company_device_id: '00000000-0000-0000-0000-000000000001',
  camera_type: 'RTSP',
  rtsp_url: null,
  camera_status: toStatus(camera.status),
  location: camera.room,
  zone: null,
  department: null,
  camera_group: null,
  resolution: camera.model === '—' ? null : camera.model,
  fps_limit: null,
  is_deleted: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// Use */path so MSW matches even if host/port differs slightly from env.
const api = (path: string) => `*${path}`;

export const camerasHandlers = [
  http.get(api('/v1/cameras'), async () => {
    await networkDelay();
    return HttpResponse.json(camerasStore.listAdopted().map(toCameraDto));
  }),

  http.get(api('/v1/cameras/:cameraId'), async ({ params }) => {
    await networkDelay();
    const camera = camerasStore.getAdoptedById(String(params.cameraId));
    if (!camera) {
      return HttpResponse.json({ detail: 'Camera not found' }, { status: 404 });
    }
    return HttpResponse.json(toCameraDto(camera));
  }),

  http.post(api('/v1/cameras'), async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as CreateCameraBody;

    if (!body.camera_name?.trim() || !body.company_device_id?.trim()) {
      return HttpResponse.json(
        { detail: 'camera_name and company_device_id are required' },
        { status: 400 },
      );
    }

    const camera: MockAdoptedCamera = {
      id: crypto.randomUUID(),
      name: body.camera_name.trim(),
      status: 'Connecting',
      manufacturer: 'RTSP',
      model: '—',
      room: body.location?.trim() || 'Default',
      provider: body.camera_type?.trim() || 'RTSP',
      last_seen: 'just now',
      snapshot_label: body.location?.trim() || 'Default',
      latency_ms: 50,
    };

    camerasStore.addAdopted(camera);
    camerasStore.addRoom(camera.room);

    return HttpResponse.json(toCameraDto(camera), { status: 201 });
  }),

  http.get(api('/api/v1/cameras'), async () => {
    await networkDelay();
    return HttpResponse.json({
      code: 200,
      message: null,
      data: camerasStore.listAdopted(),
    });
  }),

  http.get(api('/api/v1/cameras/rooms'), async () => {
    await networkDelay();
    return HttpResponse.json({
      code: 200,
      message: null,
      data: camerasStore.listRooms(),
    });
  }),

  http.post(api('/api/v1/cameras/discover/scan'), async () => {
    await networkDelay();
    return HttpResponse.json({
      code: 200,
      message: null,
      data: {
        ip_range: '192.168.1.1 – 255',
        devices: camerasStore.listDiscovered(),
      },
    });
  }),

  http.post(api('/api/v1/cameras/connect'), async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as ConnectBody;
    if (!body.username?.trim() || !body.password?.trim()) {
      return HttpResponse.json(
        { code: 400, message: 'Connection failed. Check credentials.' },
        { status: 400 },
      );
    }

    const device = camerasStore
      .listDiscovered()
      .find((item) => item.id === body.device_id);

    if (!device) {
      return HttpResponse.json(
        { code: 404, message: 'Device not found' },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      code: 200,
      message: null,
      data: { ok: true, device },
    });
  }),

  http.get(api('/api/v1/events/recent'), async () => {
    await networkDelay();
    return HttpResponse.json({
      code: 200,
      message: null,
      data: camerasStore.listEvents(),
    });
  }),

  http.get(api('/api/v1/cameras/:cameraId/events'), async ({ params }) => {
    await networkDelay();
    return HttpResponse.json({
      code: 200,
      message: null,
      data: camerasStore.listEventsByCamera(String(params.cameraId)),
    });
  }),

  http.get(api('/api/v1/cameras/:cameraId'), async ({ params }) => {
    await networkDelay();
    const camera = camerasStore.getAdoptedById(String(params.cameraId));
    if (!camera) {
      return HttpResponse.json(
        { code: 404, message: 'Camera not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json({
      code: 200,
      message: null,
      data: camera,
    });
  }),

  http.post(api('/api/v1/cameras'), async ({ request }) => {
    await networkDelay();
    const body = (await request.json()) as AddCameraBody;

    if (!body.name?.trim() || !body.room?.trim()) {
      return HttpResponse.json(
        { code: 400, message: 'Name and room are required' },
        { status: 400 },
      );
    }

    const camera: MockAdoptedCamera = {
      id: crypto.randomUUID(),
      name: body.name.trim(),
      status: 'Online',
      manufacturer: body.manufacturer?.trim() || 'Unknown',
      model: body.model?.trim() || '—',
      room: body.room.trim(),
      provider: body.provider?.trim() || 'RTSP',
      last_seen: 'just now',
      snapshot_label: body.room.trim(),
      latency_ms: 50 + Math.floor(Math.random() * 40),
    };

    camerasStore.addAdopted(camera);
    camerasStore.addRoom(camera.room);

    return HttpResponse.json({
      code: 200,
      message: null,
      data: camera,
    });
  }),
];
