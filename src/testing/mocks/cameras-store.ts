import camerasSeed from './data/cameras.json';
import eventsSeed from './data/events.json';

export type MockAdoptedCamera = {
  id: string;
  name: string;
  status: 'Online' | 'Connecting' | 'Error';
  manufacturer: string;
  model: string;
  room: string;
  provider: string;
  last_seen: string;
  snapshot_label: string;
  latency_ms: number;
  error_message?: string;
};

export type MockDiscoveredCamera = {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  ip: string;
  provider: string;
  hidden: boolean;
};

export type MockCameraEvent = {
  id: string;
  camera_id: string;
  camera_name: string;
  time: string;
  label: string;
  kind: 'Motion' | 'Person' | 'Doorbell';
  created_at: string;
};

let adopted = structuredClone(camerasSeed.adopted) as MockAdoptedCamera[];
const discovered = structuredClone(
  camerasSeed.discovered,
) as MockDiscoveredCamera[];
let rooms = [...camerasSeed.rooms];
const events = structuredClone(eventsSeed.events) as MockCameraEvent[];

export const camerasStore = {
  listAdopted: () => adopted,
  getAdoptedById: (id: string) => adopted.find((camera) => camera.id === id),
  addAdopted: (camera: MockAdoptedCamera) => {
    adopted = [...adopted, camera];
    return camera;
  },
  listDiscovered: () => discovered,
  listRooms: () => rooms,
  addRoom: (room: string) => {
    if (!rooms.includes(room)) {
      rooms = [...rooms, room];
    }
    return rooms;
  },
  listEvents: () =>
    [...events].sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
  listEventsByCamera: (cameraId: string) =>
    camerasStore.listEvents().filter((event) => event.camera_id === cameraId),
};
